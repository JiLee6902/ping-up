import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, SellerReview, MarketplaceOrder, User } from '@app/entity';
import { ProductStatus, MarketplaceOrderStatus } from '@app/enum';
import { SearchProductsDto, ProductSortBy } from '../dto';

@Injectable()
export class MarketplaceRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(SellerReview)
    private readonly reviewRepo: Repository<SellerReview>,
    @InjectRepository(MarketplaceOrder)
    private readonly orderRepo: Repository<MarketplaceOrder>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ============ PRODUCT ============

  async createProduct(data: Partial<Product>): Promise<Product> {
    const product = this.productRepo.create(data);
    return this.productRepo.save(product);
  }

  async findProductById(id: string): Promise<Product | null> {
    return this.productRepo.findOne({
      where: { id, status: ProductStatus.ACTIVE },
      relations: ['user'],
    });
  }

  async findProductByIdIncludingAll(id: string): Promise<Product | null> {
    return this.productRepo.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    await this.productRepo.update(id, data);
  }

  async softDeleteProduct(id: string): Promise<void> {
    await this.productRepo.update(id, { status: ProductStatus.DELETED });
  }

  async incrementViews(id: string): Promise<void> {
    await this.productRepo.increment({ id }, 'viewsCount', 1);
  }

  async searchProducts(dto: SearchProductsDto): Promise<{ products: Product[]; total: number }> {
    const limit = dto.limit || 20;
    const offset = dto.offset || 0;

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.user', 'user')
      .where('product.status = :status', { status: ProductStatus.ACTIVE });

    if (dto.query) {
      qb.andWhere(
        '(LOWER(product.title) LIKE LOWER(:query) OR LOWER(product.description) LIKE LOWER(:query))',
        { query: `%${dto.query}%` },
      );
    }

    if (dto.category) {
      qb.andWhere('product.category = :category', { category: dto.category });
    }

    if (dto.condition) {
      qb.andWhere('product.condition = :condition', { condition: dto.condition });
    }

    if (dto.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: dto.minPrice });
    }

    if (dto.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: dto.maxPrice });
    }

    if (dto.location) {
      qb.andWhere('LOWER(product.location) LIKE LOWER(:location)', {
        location: `%${dto.location}%`,
      });
    }

    // Sort
    switch (dto.sortBy) {
      case ProductSortBy.PRICE_ASC:
        qb.orderBy('product.price', 'ASC');
        break;
      case ProductSortBy.PRICE_DESC:
        qb.orderBy('product.price', 'DESC');
        break;
      case ProductSortBy.OLDEST:
        qb.orderBy('product.created_at', 'ASC');
        break;
      case ProductSortBy.MOST_VIEWED:
        qb.orderBy('product.views_count', 'DESC');
        break;
      case ProductSortBy.NEWEST:
      default:
        qb.orderBy('product.created_at', 'DESC');
        break;
    }

    const [products, total] = await qb.skip(offset).take(limit).getManyAndCount();
    return { products, total };
  }

  async getProductsByUser(userId: string, limit = 20, offset = 0): Promise<Product[]> {
    return this.productRepo.find({
      where: { userId, status: ProductStatus.ACTIVE },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  async getAllProductsByUser(userId: string, limit = 20, offset = 0): Promise<Product[]> {
    return this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.user', 'user')
      .where('product.userId = :userId', { userId })
      .andWhere('product.status != :deleted', { deleted: ProductStatus.DELETED })
      .orderBy('product.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();
  }

  // ============ SAVES ============

  async toggleSave(userId: string, productId: string): Promise<boolean> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['savedBy'],
    });
    if (!product) return false;

    const isSaved = product.savedBy.some((u) => u.id === userId);

    if (isSaved) {
      product.savedBy = product.savedBy.filter((u) => u.id !== userId);
      product.savesCount = Math.max(0, product.savesCount - 1);
      await this.productRepo.save(product);
      return false;
    } else {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) return false;
      product.savedBy.push(user);
      product.savesCount += 1;
      await this.productRepo.save(product);
      return true;
    }
  }

  async getSavedProducts(userId: string, limit = 20, offset = 0): Promise<Product[]> {
    return this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.user', 'user')
      .innerJoin('product.savedBy', 'savedUser', 'savedUser.id = :userId', { userId })
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .orderBy('product.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();
  }

  async isSavedByUser(userId: string, productId: string): Promise<boolean> {
    const count = await this.productRepo
      .createQueryBuilder('product')
      .innerJoin('product.savedBy', 'user', 'user.id = :userId', { userId })
      .where('product.id = :productId', { productId })
      .getCount();
    return count > 0;
  }

  async getSaveStatusForProducts(userId: string, productIds: string[]): Promise<Set<string>> {
    if (!productIds.length) return new Set();
    const rows = await this.productRepo
      .createQueryBuilder('product')
      .innerJoin('product.savedBy', 'user', 'user.id = :userId', { userId })
      .where('product.id IN (:...productIds)', { productIds })
      .select('product.id')
      .getMany();
    return new Set(rows.map((r) => r.id));
  }

  // ============ REVIEWS ============

  async createReview(data: Partial<SellerReview>): Promise<SellerReview> {
    const review = this.reviewRepo.create(data);
    return this.reviewRepo.save(review);
  }

  async getReviewsForSeller(sellerId: string, limit = 20, offset = 0): Promise<SellerReview[]> {
    return this.reviewRepo.find({
      where: { sellerId },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  async getSellerRating(sellerId: string): Promise<{ avgRating: number; totalReviews: number }> {
    const result = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.seller_id = :sellerId', { sellerId })
      .getRawOne();

    return {
      avgRating: parseFloat(result.avgRating) || 0,
      totalReviews: parseInt(result.totalReviews) || 0,
    };
  }

  async hasReviewed(reviewerId: string, sellerId: string): Promise<boolean> {
    const count = await this.reviewRepo.count({
      where: { reviewerId, sellerId },
    });
    return count > 0;
  }

  // ============ ORDERS ============

  async createOrder(data: Partial<MarketplaceOrder>): Promise<MarketplaceOrder> {
    const order = this.orderRepo.create(data);
    return this.orderRepo.save(order);
  }

  async getOrderByCode(orderCode: string): Promise<MarketplaceOrder | null> {
    return this.orderRepo.findOne({
      where: { orderCode },
      relations: ['product', 'buyer', 'seller'],
    });
  }

  async updateOrderStatus(
    orderCode: string,
    status: MarketplaceOrderStatus,
    vnpayData?: Record<string, any>,
  ): Promise<void> {
    const updateData: Partial<MarketplaceOrder> = { status };
    if (vnpayData) {
      updateData.vnpayTransactionNo = vnpayData.transactionNo;
      updateData.vnpayResponseCode = vnpayData.responseCode;
      updateData.vnpayData = vnpayData.rawData;
    }
    await this.orderRepo.update({ orderCode }, updateData);
  }

  async getOrdersByBuyer(userId: string, limit = 20, offset = 0): Promise<MarketplaceOrder[]> {
    return this.orderRepo.find({
      where: { buyerId: userId },
      relations: ['product', 'seller'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  async getOrdersBySeller(userId: string, limit = 20, offset = 0): Promise<MarketplaceOrder[]> {
    return this.orderRepo.find({
      where: { sellerId: userId },
      relations: ['product', 'buyer'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  // ============ CATEGORIES ============

  async getCategoryCounts(): Promise<{ category: string; count: number }[]> {
    return this.productRepo
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .addSelect('COUNT(product.id)', 'count')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .groupBy('product.category')
      .getRawMany();
  }
}
