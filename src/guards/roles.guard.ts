import { CanActivate, Injectable, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    console.log('roles guard', context);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 2000);
    });
  }
}
