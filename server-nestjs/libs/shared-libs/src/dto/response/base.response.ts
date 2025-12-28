export class BaseResponse<T> {
  success: boolean;
  message: string;
  data?: T;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static success<T>(data: T, message = 'Success'): BaseResponse<T> {
    return new BaseResponse<T>(true, message, data);
  }

  static error(message: string): BaseResponse<null> {
    return new BaseResponse<null>(false, message, null);
  }
}
