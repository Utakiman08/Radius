import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './login/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authservice = inject(AuthService);

  // Check for the custom header 'skipInterceptor'
  if (req.headers.has('skipInterceptor')) {
    // If the 'skipInterceptor' header is present, forward the request without modifying it
    const headers = req.headers.delete('skipInterceptor'); // Optional: Remove custom header
    return next(req.clone({ headers }));
  }

  // Retrieve the stored values from the AuthService
  const login_id = authservice.getLoginId();
  const password = authservice.getPassword();
  const project = authservice.getProject();

  // Get the authentication token
  const token = authservice.getToken();

  // Check if the token exists and clone the request to add the Authorization header and body data
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      },
      body: {
        ...(req.body as object), // Keep the original body
        login_id: login_id,
        password: password,
        // project: project
      }
    });
  }

  // Pass the request to the next interceptor or the server
  return next(req);
};
