import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './login/auth.service';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return new Promise((resolve) => {
    const token = authService.getToken();

    if (token) {
      resolve(true);
    } else {
      router.navigate(['/**'], { replaceUrl: true });
      resolve(false);
    }
  });
};

