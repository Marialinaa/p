import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User } from '../models/user.model';

interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(private apiService: ApiService) {
    // Verifica se há um usuário já autenticado no localStorage
    this.loadStoredUser();
  }
  
  private loadStoredUser() {
    const storedUser = localStorage.getItem('current_user');
    const token = localStorage.getItem('auth_token');
    
    if (storedUser && token) {
      try {
        this.currentUserSubject.next(JSON.parse(storedUser));
      } catch (error) {
        console.error('Erro ao carregar usuário do localStorage:', error);
        this.logout(); // Se houver erro, faz logout
      }
    }
  }
  
  register(userData: {name: string; email: string; password: string}): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/register', userData)
      .pipe(
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Falha ao registrar usuário'));
        })
      );
  }
  
  login(email: string, password: string, captcha: string): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/login', { email, password, captcha })
      .pipe(
        tap(response => {
          // Armazena os dados do usuário e o token
          localStorage.setItem('current_user', JSON.stringify(response.user));
          localStorage.setItem('auth_token', response.token);
          this.currentUserSubject.next(response.user);
        }),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Credenciais inválidas'));
        })
      );
  }
  
  logout(): void {
    // Limpa os dados armazenados
    localStorage.removeItem('current_user');
    localStorage.removeItem('auth_token');
    this.currentUserSubject.next(null);
  }
  
  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value && !!localStorage.getItem('auth_token');
  }
  
  // Validar captcha (enviando para o backend)
  validateCaptcha(captchaValue: string): Observable<{valid: boolean}> {
    return this.apiService.post<{valid: boolean}>('auth/validate-captcha', { captcha: captchaValue });
  }
  
  // Obter um novo captcha do backend
  refreshCaptcha(): Observable<{captchaId: string}> {
    return this.apiService.get<{captchaId: string}>('auth/captcha');
  }
}
