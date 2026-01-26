import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { User, Connection, Message, BlockedUser, MutedUser } from '@app/entity';
import { EmailModule } from '@app/external-infra/email';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { UserRepository } from './repository/user.repository';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Connection, Message, BlockedUser, MutedUser]),
    BullModule.registerQueue({ name: 'connection' }),
    EmailModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
