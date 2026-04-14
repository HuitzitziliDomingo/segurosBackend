import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { VerificationService } from './verification.service';

@Controller()
export class VerificationController {
  private readonly logger = new Logger(VerificationController.name);

  constructor(private readonly verificationService: VerificationService) {}

  @MessagePattern('generate-2fa')
  async handleGenerate2fa(@Payload() email: string) {
    this.logger.log(`Generando OTP para: ${email}`);
    const token = await this.verificationService.generateToken(email);
    return { success: true, email: token.email, code: token.code };
  }

  @EventPattern('send-email-2fa')
  async handleSendEmail(@Payload() payload: { email: string; code: string }) {
    this.logger.log(`Enviando email de OTP a: ${payload.email}`);
    await this.verificationService.sendEmail(payload.email, payload.code);
  }

  @MessagePattern('validate-2fa')
  async handleValidate2fa(@Payload() payload: { email: string; code: string }) {
    this.logger.log(`Validando OTP para: ${payload.email}`);
    const isValid = await this.verificationService.validateToken(
      payload.email,
      payload.code,
    );
    return { valid: isValid };
  }
}
