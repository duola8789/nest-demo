import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@/types/response.types';
import { API_RESPONSE_MESSAGE } from '@/decorators/api-response.decorator';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T) => {
        // 如果数据已经是统一格式，直接返回
        if (this.isApiResponse(data)) {
          return data as ApiResponse<T>;
        }

        // 获取自定义消息
        const customMessage = this.reflector.get<string>(API_RESPONSE_MESSAGE, context.getHandler());

        // 创建响应对象
        const apiResponse: ApiResponse<T> = {
          code: 0,
          data: data,
          message: customMessage || '请求成功',
        };

        return apiResponse;
      })
    );
  }

  private isApiResponse(data: unknown): data is ApiResponse<unknown> {
    return (
      typeof data === 'object' &&
      data !== null &&
      'code' in data &&
      'data' in data &&
      typeof (data as Record<string, unknown>).code === 'number'
    );
  }
}
