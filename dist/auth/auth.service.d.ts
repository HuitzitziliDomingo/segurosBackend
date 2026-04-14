import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { Auth } from './entities/auth.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private authRepository;
    private jwtService;
    private readonly verificationClient;
    constructor(authRepository: Repository<Auth>, jwtService: JwtService, verificationClient: ClientProxy);
    register(registerDto: RegisterDto): Promise<{
        message: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        message: string;
        requires_2fa: boolean;
        email: string;
    }>;
    verify2FA(email: string, code: string): Promise<{
        access_token: string;
    }>;
    validateUser(email: string): Promise<Auth | null>;
}
