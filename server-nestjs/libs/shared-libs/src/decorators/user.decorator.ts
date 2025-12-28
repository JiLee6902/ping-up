import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
}

export const User = createParamDecorator(
  (data: keyof CurrentUser | undefined, ctx: ExecutionContext): CurrentUser | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUser;

    if (data) {
      return user[data];
    }

    return user;
  },
);
