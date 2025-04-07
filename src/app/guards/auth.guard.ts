import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    try {
      console.log('AuthGuard: verificando autenticação');
      
      // Removida a exceção para a rota /user-crud
      // Agora todas as rotas protegidas, incluindo /user-crud, exigem autenticação
      
      if (this.authService.isAuthenticated()) {
        console.log('AuthGuard: usuário autenticado, permitindo acesso');
        return true;
      }
      
      console.log('AuthGuard: usuário não autenticado, redirecionando para login');
      // Passar a URL atual como parâmetro redirectTo
      this.router.navigate(['/login'], {
        queryParams: {
          redirectTo: state.url,
          message: 'É necessário fazer login para acessar esta página.'
        }
      });
      return false;
    } catch (error) {
      console.error('Erro no AuthGuard:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}