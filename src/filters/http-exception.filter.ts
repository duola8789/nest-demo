import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '@/types/response.types';

// 定义异常响应的类型
interface ExceptionResponseObject {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  [key: string]: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: HttpStatus;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = this.extractMessageFromResponse(exceptionResponse as ExceptionResponseObject, exception.message);
      } else {
        message = exception.message;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      console.error('Unexpected error:', exception);
    }

    const errorResponse: ApiResponse<null> = {
      code: status,
      data: null,
      message: message,
    };

    response.status(status === HttpStatus.INTERNAL_SERVER_ERROR ? status : HttpStatus.OK).json(errorResponse);
  }

  private extractMessageFromResponse(exceptionResponse: ExceptionResponseObject, fallbackMessage: string): string {
    if (exceptionResponse.message) {
      if (Array.isArray(exceptionResponse.message)) {
        // 如果 message 是数组，取第一个或拼接所有消息
        return exceptionResponse.message.length > 0 ? exceptionResponse.message[0] : fallbackMessage;
      }
      return exceptionResponse.message;
    }

    if (exceptionResponse.error) {
      return exceptionResponse.error;
    }

    return fallbackMessage;
  }
}
