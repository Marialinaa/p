import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, from } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { CryptoService } from './crypto.service';
import { TwoFactorService } from './two-factor.service';
import { MySqlService } from './mysql.service';

interface AuthResponse {
  user: User;
  token: string;
  message?: string;
  requiresTwoFactor?: boolean;
}

interface LoginStatus {
  success: boolean;
  requiresTwoFactor?: boolean;
  userId?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  // Novo BehaviorSubject para rastrear usuários logados
  private loggedInUsersSubject = new BehaviorSubject<User[]>([]);
  public loggedInUsers$ = this.loggedInUsersSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private cryptoService: CryptoService,
    private twoFactorService: TwoFactorService,
    private mysqlService: MySqlService
  ) {
    console.log('AuthService inicializado');
    this.loadUserFromStorage();
    // Carregar lista de usuários logados ao inicializar o serviço
    this.loadLoggedInUsers();
  }
  
  private loadUserFromStorage(): void {
    try {
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        this.currentUserSubject.next(userData);
        console.log('Usuário carregado do localStorage:', userData);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário do localStorage:', error);
      localStorage.removeItem('current_user');
    }
  }
  
  /**
   * Carregar lista de usuários atualmente logados no sistema
   * @returns Observable com a lista de usuários logados
   */
  loadLoggedInUsers(): Observable<User[]> {
    const query = `
      SELECT * FROM usuarios 
      WHERE ultimo_login IS NOT NULL 
      AND ultimo_login > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY ultimo_login DESC
    `;
    
    return this.mysqlService.executeQuery(query).pipe(
      map((users: any[]) => {
        const loggedInUsers = users.map(user => ({
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.tipo,
          isActive: Boolean(user.ativo),
          lastLogin: user.ultimo_login ? new Date(user.ultimo_login) : undefined,
          createdAt: user.created_at ? new Date(user.created_at) : undefined
        } as User));
        
        // Atualizar o BehaviorSubject com a lista de usuários
        this.loggedInUsersSubject.next(loggedInUsers);
        
        return loggedInUsers;
      }),
      catchError(error => {
        console.error('Erro ao carregar usuários logados:', error);
        return of([]);
      })
    );
  }
  
  /**
   * Forçar logout de um usuário específico (apenas para administradores)
   * @param userId ID do usuário para forçar logout
   * @returns Observable com resultado da operação
   */
  forceLogout(userId: number): Observable<any> {
    return this.isAdmin().pipe(
      switchMap(isAdmin => {
        if (!isAdmin) {
          return throwError(() => new Error('Apenas administradores podem forçar logout de outros usuários'));
        }
        
        const query = `
          UPDATE usuarios 
          SET ultimo_login = NULL, 
              token = NULL
          WHERE id = ?
        `;
        
        return this.mysqlService.executeQuery(query, [userId]).pipe(
          tap(() => {
            // Recarregar lista de usuários logados após a operação
            this.loadLoggedInUsers().subscribe();
          })
        );
      })
    );
  }
  
  /**
   * Registra um novo usuário com senha criptografada
   */
  register(userData: {name: string; email: string; password: string;}): Observable<any> {
    return from(this.cryptoService.hashPassword(userData.password)).pipe(
      switchMap(hashedPassword => {
        // Agora, em vez de enviar para /auth/register, enviaremos para o endpoint PHP
        return this.http.post<any>(`${this.apiUrl}/register.php`, {
          name: userData.name,
          email: userData.email,
          password: userData.password // O PHP fará o hash da senha
        });
      }),
      catchError(error => {
        console.error('Erro no registro:', error);
        let errorMessage = 'Falha ao registrar usuário';
        
        // Tentando extrair mensagem de erro mais detalhada da resposta
        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  
  /**
   * Processo de login com verificação de credenciais e possível autenticação dupla
   */
  login(email: string, password: string): Observable<LoginStatus> {
    return this.http.post<any>(`${this.apiUrl}/auth/validate-credentials`, { email }).pipe(
      switchMap(response => {
        if (!response.exists) {
          return throwError(() => new Error('Credenciais inválidas'));
        }
        return from(this.cryptoService.comparePassword(password, response.passwordHash)).pipe(
          switchMap(isValid => {
            if (!isValid) {
              this.mysqlService.callProcedure('sp_register_failed_login', { p_email: email }).subscribe();
              return throwError(() => new Error('Credenciais inválidas'));
            }
            if (response.requiresTwoFactor) {
              return this.twoFactorService.initiateVerification(response.userId, email).pipe(
                map(() => ({
                  success: true,
                  requiresTwoFactor: true,
                  userId: response.userId,
                  message: 'Verifique seu email para o código de autenticação.'
                }))
              );
            } else {
              return this.completeAuthentication(response.userId, email);
            }
          })
        );
      }),
      catchError(error => {
        console.error('Erro no login:', error);
        return throwError(() => new Error(error.message || 'Ocorreu um erro durante o login'));
      })
    );
  }
  
  /**
   * Verifica o código de autenticação de dois fatores
   */
  verifyTwoFactor(userId: number, token: string): Observable<LoginStatus> {
    const isValid = this.twoFactorService.verifyToken(userId, token);
    
    if (!isValid) {
      return throwError(() => new Error('Código de verificação inválido ou expirado'));
    }
    
    // Token válido, concluir autenticação
    return this.http.get<any>(`${this.apiUrl}/auth/user/${userId}`)
      .pipe(
        switchMap(user => this.completeAuthentication(userId, user.email)),
        catchError(error => {
          return throwError(() => new Error('Erro ao completar autenticação'));
        })
      );
  }
  
  /**
   * Completa o processo de autenticação após validação bem-sucedida
   */
  private completeAuthentication(userId: number, email: string): Observable<LoginStatus> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login-complete`, { userId, email })
      .pipe(
        tap(response => {
          // Armazena os dados do usuário e o token
          localStorage.setItem('current_user', JSON.stringify(response.user));
          localStorage.setItem('auth_token', response.token);
          this.currentUserSubject.next(response.user);
          
          // Atualizar último login do usuário no banco
          this.updateLastLogin(userId).subscribe();
          
          // Recarregar lista de usuários logados
          this.loadLoggedInUsers().subscribe();
        }),
        map(response => ({
          success: true,
          requiresTwoFactor: false,
          message: 'Login realizado com sucesso'
        })),
        catchError(error => {
          return throwError(() => new Error(error.error?.message || 'Erro ao completar login'));
        })
      );
  }
  
  /**
   * Atualiza o timestamp de último login do usuário no banco de dados
   */
  private updateLastLogin(userId: number): Observable<any> {
    const query = `
      UPDATE usuarios 
      SET ultimo_login = NOW(),
          token = ? 
      WHERE id = ?
    `;
    
    const token = localStorage.getItem('auth_token') || this.generateTemporaryToken();
    
    return this.mysqlService.executeQuery(query, [token, userId]);
  }
  
  /**
   * Gera um token temporário para rastreamento de sessão
   */
  private generateTemporaryToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Login direto simplificado (apenas para desenvolvimento/teste)
   */
  directLogin(email: string, password: string): Observable<any> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          if (response.token) {
            // Garantir que os dados do usuário sejam armazenados corretamente
            localStorage.setItem('current_user', JSON.stringify(response.user));
            localStorage.setItem('auth_token', response.token);
            this.currentUserSubject.next(response.user);
            console.log('Login bem-sucedido, usuário armazenado:', response.user);
            
            // Atualizar último login e recarregar lista de usuários logados
            if (response.user && response.user.id) {
              this.updateLastLogin(response.user.id).subscribe();
              this.loadLoggedInUsers().subscribe();
            }
          }
        }),
        catchError(error => {
          console.error('Erro no login direto:', error);
          return throwError(() => new Error(error.error?.message || 'Falha na autenticação'));
        })
      );
  }
  
  /**
   * Encerra a sessão do usuário
   */
  logout(): void {
    // Obter ID do usuário antes de limpar dados
    const currentUser = this.currentUserSubject.value;
    const userId = currentUser?.id;
    
    // Limpa os dados armazenados
    localStorage.removeItem('current_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('rememberMe');
    this.currentUserSubject.next(null);
    
    // Se temos o ID, atualizar o banco para marcar usuário como deslogado
    if (userId) {
      const query = `
        UPDATE usuarios 
        SET ultimo_login = NULL, 
            token = NULL
        WHERE id = ?
      `;
      
      this.mysqlService.executeQuery(query, [userId]).subscribe({
        next: () => console.log('Status de logout atualizado no banco'),
        error: err => console.error('Erro ao atualizar status de logout:', err)
      });
      
      // Recarregar lista de usuários logados
      this.loadLoggedInUsers().subscribe();
    }
    
    // Notificar o servidor (opcional)
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe();
  }
  
  /**
   * Verifica se o usuário atual está autenticado
   */
  isAuthenticated(): boolean {
    try {
      const currentUser = this.currentUserSubject.value;
      const token = localStorage.getItem('auth_token');
      const isAuth = !!currentUser && !!token;
      console.log('Verificação de autenticação:', isAuth, 'Token:', !!token, 'User:', !!currentUser);
      return isAuth;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }
  
  /**
   * Verifica se o usuário atual tem permissão de administrador
   */
  isAdmin(): Observable<boolean> {
    try {
      const currentUser = this.currentUserSubject.value;
      return of(!!currentUser && currentUser.role === 'admin');
    } catch (error) {
      console.error('Erro ao verificar se é admin:', error);
      return of(false);
    }
  }
  
  /**
   * Verifica se o usuário tem uma permissão específica
   */
  hasPermission(permission: string): Observable<boolean> {
    const currentUser = this.currentUserSubject.value;
    
    if (!currentUser || !currentUser.role) {
      return of(false);
    }
    
    return this.mysqlService.callProcedure('sp_check_permission', { 
      p_role: currentUser.role, 
      p_permission: permission 
    }).pipe(
      map(result => result.p_has_permission === 1 || result.p_has_permission === true),
      catchError(() => of(false))
    );
  }
  
  validateCaptcha(captchaValue: string): Observable<{ valid: boolean }> {
    return of({ valid: true });
  }
}
