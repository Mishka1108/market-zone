// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }
  
  // თუ მომხმარებელი არ არის ავტორიზებული, გადავამისამართოთ ლოგინის გვერდზე
  return router.createUrlTree(['/auth/login']);
};