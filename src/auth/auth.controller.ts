import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './auth.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Iniciar sesión (Paso 1, requiere 2FA)' })
  @ApiResponse({ status: 200, description: 'Se requiere comprobación 2FA' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-2fa')
  @Public()
  @ApiOperation({ summary: 'Verificar código 2FA (Paso 2, retorna JWT)' })
  @ApiResponse({
    status: 200,
    description: 'Verificación exitosa, token generado',
  })
  @ApiResponse({ status: 401, description: 'Código inválido o expirado' })
  async verify2FA(@Body() body: { email: string; code: string }) {
    return this.authService.verify2FA(body.email, body.code);
  }
}
