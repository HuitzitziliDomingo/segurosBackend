import { Injectable, UnauthorizedException, Inject, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout, catchError, throwError } from 'rxjs';
import { Auth } from './entities/auth.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Auth)
    private authRepository: Repository<Auth>,
    private jwtService: JwtService,
    @Inject('VERIFICATION_SERVICE')
    private readonly verificationClient: ClientProxy,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, password, telephone } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.authRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new UnauthorizedException('El usuario ya existe');
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el nuevo usuario
    const newUser = this.authRepository.create({
      email,
      password: hashedPassword,
      telephone: telephone ? BigInt(telephone) : null,
    });

    await this.authRepository.save(newUser);

    return { message: 'Usuario registrado exitosamente' };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ message: string; requires_2fa: boolean; email: string }> {
    const { email, password } = loginDto;

    // Buscar el usuario por email
    const user = await this.authRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Ya NO generamos el JWT aquí, pedimos al microservicio el OTP a través de RabbitMQ
    const genResult = await lastValueFrom<{
      success: boolean;
      email: string;
      code: string;
    }>(
      this.verificationClient.send('generate-2fa', user.email).pipe(
        timeout(5000),
        catchError(() => throwError(() => new InternalServerErrorException('Servicio 2FA no disponible. Intente más tarde.')))
      )
    );

    // Y emitimos asíncronamente el evento para que se envíe por correo
    this.verificationClient.emit('send-email-2fa', {
      email: user.email,
      code: genResult.code,
    });

    return {
      message:
        'Requisitos 2FA generados. Te enviamos un código temporal por correo.',
      requires_2fa: true,
      email: user.email,
    };
  }

  async verify2FA(
    email: string,
    code: string,
  ): Promise<{ access_token: string }> {
    // Comunicarnos con microservicio para validar
    const response = await lastValueFrom<{ valid: boolean }>(
      this.verificationClient.send('validate-2fa', { email, code }).pipe(
        timeout(5000),
        catchError(() => throwError(() => new InternalServerErrorException('Servicio 2FA no disponible. Intente más tarde.')))
      )
    );

    if (!response || !response.valid) {
      throw new UnauthorizedException(
        'El código OTP es inválido o ha expirado',
      );
    }

    // Buscar al usuario real
    const user = await this.authRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado tras validación');
    }

    // Generar el JWT final
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  async validateUser(email: string): Promise<Auth | null> {
    return this.authRepository.findOne({ where: { email } });
  }
}
