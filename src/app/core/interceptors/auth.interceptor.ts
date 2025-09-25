import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

// Este é o equivalente Angular ao `api.interceptors.request.use`.
// É uma função que intercepta TODAS as requisições HttpClient.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Se o token existir, clona a requisição e adiciona o cabeçalho Authorization.
  if (token) {
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    // Continua a cadeia de requisições com a requisição clonada.
    return next(clonedReq);
  }

  // Se não houver token, continua com a requisição original.
  return next(req);
};
