import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { DatabaseService } from '../services/database.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private dbService: DatabaseService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Verifica se o usuário está autenticado
    if (this.dbService.isAuthenticated()) {
      return true; // Permite o acesso à rota protegida
    }

    // Redireciona para a página de login com uma mensagem
    this.router.navigate(['/login'], { 
      queryParams: { redirectTo: '/blog', message: 'É necessário fazer login para acessar o blog.' }
    });
    
    return false; // Bloqueia o acesso à rota protegida
  }
}