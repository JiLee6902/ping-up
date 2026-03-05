import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from '@app/entity';
import { OutboxService } from './outbox.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent])],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
