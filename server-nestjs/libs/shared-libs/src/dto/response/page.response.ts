export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class PageResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PageMeta;

  constructor(data: T[], meta: PageMeta, message = 'Success') {
    this.success = true;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  static create<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success',
  ): PageResponse<T> {
    const totalPages = Math.ceil(total / limit);
    const meta: PageMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
    return new PageResponse<T>(data, meta, message);
  }
}
