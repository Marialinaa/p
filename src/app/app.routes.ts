import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'blog',
    loadComponent: () => import('./blog/blog.component').then((m) => m.BlogComponent),
    canActivate: [AuthGuard] // Proteção da rota com o guarda
  },
  {
    path: 'user-crud',
    loadComponent: () => import('./user-crud/user-crud.component').then((m) => m.UserCrudComponent),
    canActivate: [AuthGuard] // Também protegendo o CRUD de usuários
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
