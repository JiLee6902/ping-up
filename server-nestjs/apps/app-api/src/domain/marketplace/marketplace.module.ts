import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, SellerReview, MarketplaceOrder, User } from '@app/entity';
import { MarketplaceController } from './controller/marketplace.controller';
import { MarketplaceService } from './service/marketplace.service';
import { MarketplaceRepository } from './repository/marketplace.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, SellerReview, MarketplaceOrder, User]),
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, MarketplaceRepository],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
