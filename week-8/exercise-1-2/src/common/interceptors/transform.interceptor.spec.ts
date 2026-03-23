import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('wraps response data in success envelope', (done) => {
      const mockData = { id: 1, name: 'test' };
      const mockCallHandler: CallHandler = {
        handle: () => of(mockData),
      };
      const mockContext = {} as ExecutionContext;

      interceptor
        .intercept(mockContext, mockCallHandler)
        .subscribe((result) => {
          expect(result).toEqual({ success: true, data: mockData });
          done();
        });
    });
  });
});
