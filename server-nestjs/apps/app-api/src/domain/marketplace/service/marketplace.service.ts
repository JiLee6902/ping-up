import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MarketplaceRepository } from '../repository/marketplace.repository';
import { UploadService } from '../../upload/service/upload.service';
import { VnpayService } from '@app/external-infra/vnpay';
import { ProductStatus, MarketplaceOrderStatus } from '@app/enum';
import { CreateProductDto, UpdateProductDto, SearchProductsDto, CreateReviewDto } from '../dto';

const MAX_PRODUCT_IMAGES = 6;

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private readonly marketplaceRepo: MarketplaceRepository,
    private readonly uploadService: UploadService,
    private readonly vnpayService: VnpayService,
  ) {}

  // ============ PRODUCTS ============

  async createProduct(
    userId: string,
    dto: CreateProductDto,
    imageFiles?: Express.Multer.File[],
  ) {
    if (!imageFiles?.length) {
      throw new BadRequestException('At least one image is required');
    }

    if (imageFiles.length > MAX_PRODUCT_IMAGES) {
      throw new BadRequestException(`Maximum ${MAX_PRODUCT_IMAGES} images allowed`);
    }

    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      const result = await this.uploadService.uploadPostImage(file);
      imageUrls.push(result.url);
    }

    const product = await this.marketplaceRepo.createProduct({
      userId,
      title: dto.title,
      description: dto.description,
      price: dto.price,
      category: dto.category,
      condition: dto.condition,
      location: dto.location,
      locationLat: dto.locationLat,
      locationLng: dto.locationLng,
      imageUrls,
    });

    const full = await this.marketplaceRepo.findProductById(product.id);
    return { success: true, product: this.formatProduct(full!) };
  }

  async updateProduct(
    userId: string,
    productId: string,
    dto: UpdateProductDto,
    imageFiles?: Express.Multer.File[],
    removedImages?: string[],
  ) {
    const product = await this.marketplaceRepo.findProductByIdIncludingAll(productId);
    if (!product) throw new NotFoundException('Product not found');
    if (product.userId !== userId) throw new ForbiddenException('Not your product');

    let imageUrls = product.imageUrls || [];

    if (removedImages?.length) {
      imageUrls = imageUrls.filter((url) => !removedImages.includes(url));
    }

    if (imageFiles?.length) {
      if (imageUrls.length + imageFiles.length > MAX_PRODUCT_IMAGES) {
        throw new BadRequestException(`Maximum ${MAX_PRODUCT_IMAGES} images allowed`);
      }
      for (const file of imageFiles) {
        const result = await this.uploadService.uploadPostImage(file);
        imageUrls.push(result.url);
      }
    }

    const updateData: any = { imageUrls };
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.condition !== undefined) updateData.condition = dto.condition;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.locationLat !== undefined) updateData.locationLat = dto.locationLat;
    if (dto.locationLng !== undefined) updateData.locationLng = dto.locationLng;

    await this.marketplaceRepo.updateProduct(productId, updateData);

    const updated = await this.marketplaceRepo.findProductById(productId);
    return { success: true, product: this.formatProduct(updated!) };
  }

  async deleteProduct(userId: string, productId: string) {
    const product = await this.marketplaceRepo.findProductByIdIncludingAll(productId);
    if (!product) throw new NotFoundException('Product not found');
    if (product.userId !== userId) throw new ForbiddenException('Not your product');

    await this.marketplaceRepo.softDeleteProduct(productId);
    return { success: true, message: 'Product deleted' };
  }

  async getProductDetail(productId: string, currentUserId?: string) {
    const product = await this.marketplaceRepo.findProductById(productId);
    if (!product) throw new NotFoundException('Product not found');

    await this.marketplaceRepo.incrementViews(productId);

    const sellerRating = await this.marketplaceRepo.getSellerRating(product.userId);
    let isSaved = false;
    if (currentUserId) {
      isSaved = await this.marketplaceRepo.isSavedByUser(currentUserId, productId);
    }

    return {
      success: true,
      product: {
        ...this.formatProduct(product),
        isSaved,
        seller: {
          ...this.formatUser(product.user),
          avgRating: sellerRating.avgRating,
          totalReviews: sellerRating.totalReviews,
        },
      },
    };
  }

  async searchProducts(dto: SearchProductsDto, currentUserId?: string) {
    const { products, total } = await this.marketplaceRepo.searchProducts(dto);

    let savedSet = new Set<string>();
    if (currentUserId && products.length) {
      savedSet = await this.marketplaceRepo.getSaveStatusForProducts(
        currentUserId,
        products.map((p) => p.id),
      );
    }

    return {
      success: true,
      products: products.map((p) => ({
        ...this.formatProduct(p),
        isSaved: savedSet.has(p.id),
      })),
      total,
      hasMore: (dto.offset || 0) + products.length < total,
    };
  }

  async getMyListings(userId: string, limit = 20, offset = 0) {
    const products = await this.marketplaceRepo.getAllProductsByUser(userId, limit, offset);
    return {
      success: true,
      products: products.map((p) => this.formatProduct(p)),
    };
  }

  async markAsSold(userId: string, productId: string) {
    const product = await this.marketplaceRepo.findProductByIdIncludingAll(productId);
    if (!product) throw new NotFoundException('Product not found');
    if (product.userId !== userId) throw new ForbiddenException('Not your product');

    await this.marketplaceRepo.updateProduct(productId, { status: ProductStatus.SOLD });
    return { success: true, message: 'Product marked as sold' };
  }

  // ============ SAVES ============

  async toggleSave(userId: string, productId: string) {
    const product = await this.marketplaceRepo.findProductById(productId);
    if (!product) throw new NotFoundException('Product not found');

    const isSaved = await this.marketplaceRepo.toggleSave(userId, productId);
    return { success: true, isSaved };
  }

  async getSavedProducts(userId: string, limit = 20, offset = 0) {
    const products = await this.marketplaceRepo.getSavedProducts(userId, limit, offset);
    return {
      success: true,
      products: products.map((p) => this.formatProduct(p)),
    };
  }

  // ============ REVIEWS ============

  async createReview(userId: string, dto: CreateReviewDto) {
    if (userId === dto.sellerId) {
      throw new BadRequestException('Cannot review yourself');
    }

    const already = await this.marketplaceRepo.hasReviewed(userId, dto.sellerId);
    if (already) {
      throw new BadRequestException('You already reviewed this seller');
    }

    const review = await this.marketplaceRepo.createReview({
      reviewerId: userId,
      sellerId: dto.sellerId,
      rating: dto.rating,
      comment: dto.comment,
    });

    return { success: true, review };
  }

  async getSellerProfile(sellerId: string) {
    const user = await this.marketplaceRepo['userRepo'].findOne({
      where: { id: sellerId },
    });
    if (!user) throw new NotFoundException('Seller not found');

    const rating = await this.marketplaceRepo.getSellerRating(sellerId);
    const products = await this.marketplaceRepo.getProductsByUser(sellerId, 20, 0);

    return {
      success: true,
      seller: {
        ...this.formatUser(user),
        avgRating: rating.avgRating,
        totalReviews: rating.totalReviews,
      },
      products: products.map((p) => this.formatProduct(p)),
    };
  }

  async getSellerReviews(sellerId: string, limit = 20, offset = 0) {
    const reviews = await this.marketplaceRepo.getReviewsForSeller(sellerId, limit, offset);
    const rating = await this.marketplaceRepo.getSellerRating(sellerId);

    return {
      success: true,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewer: this.formatUser(r.reviewer),
      })),
      avgRating: rating.avgRating,
      totalReviews: rating.totalReviews,
    };
  }

  // ============ ORDERS (VNPAY) ============

  async createOrder(userId: string, productId: string, ipAddr: string) {
    const product = await this.marketplaceRepo.findProductById(productId);
    if (!product) throw new NotFoundException('Product not found');
    if (product.userId === userId) throw new BadRequestException('Cannot buy your own product');
    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('Product is not available');
    }

    const orderCode = `MP${Date.now()}${uuidv4().slice(0, 8)}`.toUpperCase();

    const order = await this.marketplaceRepo.createOrder({
      buyerId: userId,
      sellerId: product.userId,
      productId: product.id,
      orderCode,
      amount: product.price,
      status: MarketplaceOrderStatus.PENDING,
    });

    const paymentUrl = this.vnpayService.createPaymentUrl({
      orderId: orderCode,
      amount: Number(product.price),
      orderInfo: `Mua san pham: ${product.title}`,
      ipAddr,
    });

    return { success: true, order, paymentUrl };
  }

  async handleVnpayReturn(query: any) {
    const result = this.vnpayService.verifyReturnUrl(query);

    if (!result.isValid) {
      return { success: false, message: 'Invalid signature' };
    }

    const order = await this.marketplaceRepo.getOrderByCode(result.orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    if (order.status !== MarketplaceOrderStatus.PENDING) {
      return {
        success: order.status === MarketplaceOrderStatus.PAID,
        message: 'Order already processed',
      };
    }

    const isSuccess = this.vnpayService.isPaymentSuccess(result.responseCode);

    if (isSuccess) {
      await this.marketplaceRepo.updateOrderStatus(result.orderId, MarketplaceOrderStatus.PAID, {
        transactionNo: result.transactionNo,
        responseCode: result.responseCode,
        rawData: result.rawData,
      });

      // Mark product as sold
      await this.marketplaceRepo.updateProduct(order.productId, {
        status: ProductStatus.SOLD,
      });

      this.logger.log(`Marketplace order paid: ${result.orderId}, product sold`);
      return { success: true, message: 'Payment successful', orderId: result.orderId };
    } else {
      await this.marketplaceRepo.updateOrderStatus(
        result.orderId,
        MarketplaceOrderStatus.CANCELLED,
        {
          transactionNo: result.transactionNo,
          responseCode: result.responseCode,
          rawData: result.rawData,
        },
      );
      return { success: false, message: result.message };
    }
  }

  async handleVnpayIpn(body: any) {
    const result = this.vnpayService.verifyIpnCall(body);

    if (!result.isValid) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const order = await this.marketplaceRepo.getOrderByCode(result.orderId);
    if (!order) return { RspCode: '01', Message: 'Order not found' };
    if (order.status !== MarketplaceOrderStatus.PENDING) {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }
    if (Number(order.amount) !== result.amount) {
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    const isSuccess = this.vnpayService.isPaymentSuccess(result.responseCode);

    if (isSuccess) {
      await this.marketplaceRepo.updateOrderStatus(result.orderId, MarketplaceOrderStatus.PAID, {
        transactionNo: result.transactionNo,
        responseCode: result.responseCode,
        rawData: result.rawData,
      });
      await this.marketplaceRepo.updateProduct(order.productId, {
        status: ProductStatus.SOLD,
      });
    } else {
      await this.marketplaceRepo.updateOrderStatus(
        result.orderId,
        MarketplaceOrderStatus.CANCELLED,
        {
          transactionNo: result.transactionNo,
          responseCode: result.responseCode,
          rawData: result.rawData,
        },
      );
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  async getMyPurchases(userId: string, limit = 20, offset = 0) {
    const orders = await this.marketplaceRepo.getOrdersByBuyer(userId, limit, offset);
    return { success: true, orders };
  }

  async getMySales(userId: string, limit = 20, offset = 0) {
    const orders = await this.marketplaceRepo.getOrdersBySeller(userId, limit, offset);
    return { success: true, orders };
  }

  // ============ CATEGORIES ============

  async getCategories() {
    const counts = await this.marketplaceRepo.getCategoryCounts();
    return { success: true, categories: counts };
  }

  // ============ HELPERS ============

  private formatProduct(product: any) {
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: Number(product.price),
      currency: product.currency,
      category: product.category,
      condition: product.condition,
      status: product.status,
      imageUrls: product.imageUrls || [],
      location: product.location,
      viewsCount: product.viewsCount,
      savesCount: product.savesCount,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      seller: product.user ? this.formatUser(product.user) : undefined,
    };
  }

  private formatUser(user: any) {
    if (!user) return null;
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified,
      location: user.location,
    };
  }
}
