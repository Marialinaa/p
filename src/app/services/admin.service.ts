import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Verifica se o usuário atual é um administrador
   * @returns Observable<boolean> indicando se é admin ou não
   */
  isCurrentUserAdmin(): Observable<boolean> {
    const currentUser = this.authService.currentUserSubject?.value;
    
    if (!currentUser) {
      return of(false);
    }
    
    return this.isUserAdmin(currentUser.id);
  }

  /**
   * Verifica se um usuário específico é administrador
   * @param userId ID do usuário para verificar
   * @returns Observable<boolean> indicando se é admin ou não
   */
  isUserAdmin(userId: number): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/check_admin.php?userId=${userId}`).pipe(
      map(response => {
        return response.isAdmin === true;
      }),
      catchError(error => {
        console.error('Erro ao verificar status de admin:', error);
        return of(false);
      })
    );
  }

  /**
   * Verifica se um email específico tem permissões de admin
   * @param email Email para verificar
   * @returns Observable<boolean> indicando se o email tem permissões de admin
   */
  isEmailAdmin(email: string): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/check_admin.php?email=${encodeURIComponent(email)}`).pipe(
      map(response => {
        return response.isAdmin === true;
      }),
      catchError(error => {
        console.error('Erro ao verificar status de admin para o email:', error);
        return of(false);
      })
    );
  }

  /**
   * Obtém a lista de configurações do sistema
   * @returns Observable com a lista de configurações
   */
  getSystemConfigs(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/admin_config.php`).pipe(
      map(response => response.configs || []),
      catchError(error => {
        console.error('Erro ao obter configurações do sistema:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtém uma configuração específica do sistema
   * @param key Chave da configuração
   * @returns Observable com o valor da configuração
   */
  getSystemConfig(key: string): Observable<string | null> {
    return this.http.get<any>(`${this.apiUrl}/admin_config.php?key=${encodeURIComponent(key)}`).pipe(
      map(response => {
        const configs = response.configs || [];
        if (configs.length > 0) {
          return configs[0].config_value;
        }
        return null;
      }),
      catchError(error => {
        console.error(`Erro ao obter configuração '${key}':`, error);
        return of(null);
      })
    );
  }

  /**
   * Salva ou atualiza uma configuração do sistema
   * @param key Chave da configuração
   * @param value Valor da configuração
   * @param description Descrição opcional
   * @returns Observable com resultado da operação
   */
  saveSystemConfig(key: string, value: string, description?: string): Observable<any> {
    const data = { key, value, description };
    
    return this.http.post<any>(`${this.apiUrl}/admin_config.php`, data).pipe(
      catchError(error => {
        console.error('Erro ao salvar configuração do sistema:', error);
        throw error;
      })
    );
  }
}
