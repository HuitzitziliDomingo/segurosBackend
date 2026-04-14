import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

interface RmqModuleOptions {
  name: string;
}

@Module({
  imports: [ConfigModule],
})
export class RabbitMQModule {
  static register({ name }: RmqModuleOptions): DynamicModule {
    return {
      module: RabbitMQModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name,
            useFactory: (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [
                  configService.get<string>('RABBITMQ_URL') ||
                    'amqp://guest:guest@localhost:5672',
                ],
                queue:
                  configService.get<string>(`RABBITMQ_${name}_QUEUE`) ||
                  'verification_queue',
                queueOptions: {
                  durable: true,
                },
              },
            }),
            inject: [ConfigService],
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
