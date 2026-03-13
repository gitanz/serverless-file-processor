import { HttpInterceptorFn } from '@angular/common/http';

export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const correlationId = crypto.randomUUID();

  const cloned = req.clone({
    headers: req.headers.set('x-cor-id', correlationId),
  });

  return next(cloned);
};
