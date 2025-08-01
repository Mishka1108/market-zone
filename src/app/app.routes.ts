import { Routes } from '@angular/router';
import { authGuard } from '../app/guard/auth.guard';
import { adminGuard } from '../app/guard/admin.guard';
import { HomeComponent } from './home/home.component';

import { ContactComponent } from './contact/contact.component';
import { PublicProductsComponent } from './public-products/public-products.component';
import { ProductDetailsComponent } from './product-details/product-details.component'; // შეცვლილი ProductDetailComponent -> ProductDetailsComponent
import { LoginComponent } from './login/login.component';
import { ForgotpasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';


export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'verify/:token',
        loadComponent: () =>
          import('./verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
      }
    ]
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [() => authGuard()]
  },
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./admin-login/admin-login.component').then((m) => m.AdminLoginComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
        canActivate: [() => adminGuard()]
      }
    ]
  },
  { path: '', component: HomeComponent }, // საწყისი გვერდი შევცვალეთ
  { path: 'home', component: HomeComponent },
  { path: 'contact', component: ContactComponent },
  {path: 'login', component: LoginComponent},
  { path: 'public-products', component: PublicProductsComponent }, // საჯარო პროდუქტების გვერდი
  { path: 'product-details/:id', component: ProductDetailsComponent }, // შეცვლილი ProductDetailComponent -> ProductDetailsComponent
  {path: 'forgot-password', component: ForgotpasswordComponent},
  {path: 'reset-password', component: ResetPasswordComponent},
  {path: 'auth/reset-password/:token', component: ResetPasswordComponent},
];