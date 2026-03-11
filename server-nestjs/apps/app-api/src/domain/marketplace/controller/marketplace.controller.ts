import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, Public, User as CurrentUser } from '@app/shared-libs';
import { ConfigService } from '@nestjs/config';
import { MarketplaceService } from '../service/marketplace.service';
import { CreateProductDto, UpdateProductDto, SearchProductsDto, CreateReviewDto } from '../dto';

interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly configService: ConfigService,
  ) {}

  // ============ PRODUCTS ============

  @Post()
  @UseInterceptors(FilesInterceptor('images', 6))
  async createProduct(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.marketplaceService.createProduct(user.id, dto, files);
  }

  @Put(':productId')
  @UseInterceptors(FilesInterceptor('images', 6))
  async updateProduct(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
    @Body('removedImages') removedImages?: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const removed = removedImages ? JSON.parse(removedImages) : [];
    return this.marketplaceService.updateProduct(user.id, productId, dto, files, removed);
  }

  @Delete(':productId')
  async deleteProduct(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string,
  ) {
    return this.marketplaceService.deleteProduct(user.id, productId);
  }

  @Post(':productId/sold')
  async markAsSold(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string,
  ) {
    return this.marketplaceService.markAsSold(user.id, productId);
  }

  @Public()
  @Get('search')
  async searchProducts(
    @CurrentUser() user: CurrentUserPayload | null,
    @Query() dto: SearchProductsDto,
  ) {
    return this.marketplaceService.searchProducts(dto, user?.id || undefined);
  }

  @Public()
  @Get('categories')
  async getCategories() {
    return this.marketplaceService.getCategories();
  }

  @Get('my-listings')
  async getMyListings(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.marketplaceService.getMyListings(user.id, limit, offset);
  }

  @Get('saved')
  async getSavedProducts(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.marketplaceService.getSavedProducts(user.id, limit, offset);
  }

  @Post('save')
  async toggleSave(
    @CurrentUser() user: CurrentUserPayload,
    @Body('productId') productId: string,
  ) {
    return this.marketplaceService.toggleSave(user.id, productId);
  }

  // ============ SELLER ============

  @Public()
  @Get('seller/:sellerId')
  async getSellerProfile(@Param('sellerId') sellerId: string) {
    return this.marketplaceService.getSellerProfile(sellerId);
  }

  @Public()
  @Get('seller/:sellerId/reviews')
  async getSellerReviews(
    @Param('sellerId') sellerId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.marketplaceService.getSellerReviews(sellerId, limit, offset);
  }

  @Post('review')
  async createReview(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.marketplaceService.createReview(user.id, dto);
  }

  // ============ ORDERS ============

  @Post('order/create')
  async createOrder(
    @CurrentUser() user: CurrentUserPayload,
    @Body('productId') productId: string,
    @Req() req: Request,
  ) {
    const ipAddr =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    return this.marketplaceService.createOrder(user.id, productId, ipAddr);
  }

  @Public()
  @Get('order/vnpay-return')
  async handleVnpayReturn(@Query() query: any, @Res() res: Response) {
    const result = await this.marketplaceService.handleVnpayReturn(query);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const redirectUrl = `${frontendUrl}/marketplace/payment/result?success=${result.success}&message=${encodeURIComponent(result.message)}`;
    return res.redirect(redirectUrl);
  }

  @Public()
  @Post('order/vnpay-ipn')
  async handleVnpayIpn(@Body() body: any) {
    return this.marketplaceService.handleVnpayIpn(body);
  }

  @Get('order/my-purchases')
  async getMyPurchases(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.marketplaceService.getMyPurchases(user.id, limit, offset);
  }

  @Get('order/my-sales')
  async getMySales(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.marketplaceService.getMySales(user.id, limit, offset);
  }

  // ============ PRODUCT DETAIL (must be last due to :productId param) ============

  @Public()
  @Get(':productId')
  async getProductDetail(
    @CurrentUser() user: CurrentUserPayload | null,
    @Param('productId') productId: string,
  ) {
    return this.marketplaceService.getProductDetail(productId, user?.id || undefined);
  }
}
