import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VnpayService } from './vnpay.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [VnpayService],
  exports: [VnpayService],
})
export class VnpayModule {}
