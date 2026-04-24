import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationToken } from './entities/verification-token.entity';
// import { MailerService } from '@nestjs-modules/mailer'; // Descomentaremos esto al configurar mailer

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @InjectRepository(VerificationToken)
    private readonly tokenRepository: Repository<VerificationToken>,
    // private readonly mailerService: MailerService,
  ) {}

  async generateToken(email: string): Promise<VerificationToken> {
    // 1. Borrar tokens anteriores para evitar acumulación
    await this.tokenRepository.delete({ email });

    // 2. Generar string aleatorio de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Expiración en 15 minutos
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // 4. Guardar
    const token = this.tokenRepository.create({ email, code, expiresAt });
    return await this.tokenRepository.save(token);
  }

  async sendEmail(email: string, code: string): Promise<void> {
    // Aquí integraremos envío real con smtp
    this.logger.log(
      `[SIMULACIÓN EMAIL] Para: ${email} -> Tu código es: ${code}`,
    );

    /*
    await this.mailerService.sendMail({
      to: email,
      subject: 'Tu código de verificación 2FA',
      text: `Tu código es: ${code}, expira en 15 minutos.`,
    });
    */
  }

  async validateToken(email: string, code: string): Promise<boolean> {
    const token = await this.tokenRepository.findOne({ where: { email } });

    if (!token) {
      return false;
    }

    if (token.code !== code || new Date() > token.expiresAt) {
      return false;
    }

    // Es válido, lo borramos para que no se re-utilice
    await this.tokenRepository.delete({ id: token.id });
    return true;
  }
}
