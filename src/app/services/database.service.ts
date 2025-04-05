import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model'; // Importar User do arquivo correto
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, delay, tap } from 'rxjs/operators';

export interface BlogPost {
  id?: number;
  title: string;
  content: string;
  author: string;
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  // URL base da API - substituir pelo seu endpoint real
  private apiUrl = 'https://api.example.com'; // URL simulada
  
  // Usuários armazenados localmente para simulação do banco de dados
  private registeredUsers = [
    { email: 'teste@email.com', password: '123456', name: 'Usuário Teste' },
    { email: 'admin@admin.com', password: 'admin123', name: 'Administrador' }
  ];

  // Subject para gerenciar o estado do usuário logado
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private http: HttpClient
  ) {
    // Recuperar usuários previamente registrados do localStorage
    const storedUsers = localStorage.getItem('registeredUsers');
    if (storedUsers) {
      try {
        this.registeredUsers = JSON.parse(storedUsers);
      } catch (error) {
        console.error('Erro ao carregar usuários do localStorage:', error);
      }
    }
    
    // Verificar se há um usuário logado
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(storedUser));
      } catch (error) {
        console.error('Erro ao carregar usuário do localStorage:', error);
      }
    }
  }

  // Simulação do banco de dados em memória para testes
  private users: User[] = [
    { id: 1, name: 'Admin', email: 'admin@exemplo.com' },
    { id: 2, name: 'Usuário Teste', email: 'usuario@exemplo.com' }
  ];

  // Métodos para usuários
  getUsers(): Observable<User[]> {
    // Retorna uma cópia do array para evitar modificação direta
    return of([...this.users]);
  }

  getUserById(id: number): Observable<User> {
    const user = this.users.find(u => u.id === id);
    if (user) {
      return of({...user});
    }
    return throwError(() => new Error('Usuário não encontrado'));
  }

  getUserByEmail(email: string): Observable<User> {
    const user = this.users.find(u => u.email === email);
    if (user) {
      return of({...user});
    }
    return throwError(() => new Error('Usuário não encontrado'));
  }

  createUser(user: Partial<User>): Observable<User> {
    // Verificar se o email já está em uso
    const existingUser = this.registeredUsers.find(u => u.email === user.email);
    if (existingUser) {
      return throwError(() => new Error('Este email já está em uso. Por favor, use outro email.'));
    }

    // Simulando geração de ID
    const maxId = this.users.reduce((max, u) => Math.max(max, u.id || 0), 0);
    const newUser: User = {
      id: maxId + 1,
      name: user.name || '',
      email: user.email || '',
      // Em um sistema real, faríamos o hash da senha
      password: user.password
    };
    
    // Adicionar à lista de usuários
    this.users.push(newUser);
    
    // Adicionar à lista de usuários registrados
    this.registeredUsers.push({
      name: user.name || '',
      email: user.email || '',
      password: user.password || ''
    });
    
    // Salvar no localStorage para persistência
    localStorage.setItem('registeredUsers', JSON.stringify(this.registeredUsers));
    
    return of({...newUser});
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    const index = this.users.findIndex(u => u.id === id);
    if (index >= 0) {
      // Atualizar mantendo o ID original
      const updatedUser: User = {
        ...this.users[index],
        name: user.name || this.users[index].name,
        email: user.email || this.users[index].email,
        // Atualizar senha apenas se fornecida
        ...(user.password ? { password: user.password } : {})
      };
      
      this.users[index] = updatedUser;
      return of({...updatedUser});
    }
    return throwError(() => new Error('Usuário não encontrado'));
  }

  deleteUser(id: number): Observable<void> {
    const index = this.users.findIndex(u => u.id === id);
    if (index >= 0) {
      this.users.splice(index, 1);
      return of(void 0);
    }
    return throwError(() => new Error('Usuário não encontrado'));
  }

  // Autenticação
  login(email: string, password: string): Observable<any> {
    console.log('Tentativa de login:', email);
    
    // Verificar se existe um usuário com as credenciais informadas
    const user = this.registeredUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    return of(null).pipe(
      delay(800), // Simulando tempo de resposta da rede
      tap(() => {
        console.log('Usuário encontrado:', user ? 'Sim' : 'Não');
        
        if (!user) {
          throw new Error('Credenciais inválidas. Verifique seu email e senha.');
        }
        
        // Simula o armazenamento do token de autenticação
        const token = this.generateFakeToken(user);
        localStorage.setItem('authToken', token);
        
        // Salvar o usuário atual
        const currentUser = {
          name: user.name,
          email: user.email
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Atualizar o subject de usuário atual
        this.currentUserSubject.next(currentUser);
        
        console.log('Login bem-sucedido para:', email);
        return user;
      }),
      catchError((error: HttpErrorResponse | Error) => {
        let errorMessage = 'Ocorreu um erro desconhecido ao processar o login';
        
        if (error instanceof HttpErrorResponse) {
          errorMessage = error.error?.message || 'Erro no servidor. Tente novamente mais tarde.';
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        console.error('Erro de login:', errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberMe');
    this.currentUserSubject.next(null);
  }

  private generateFakeToken(user: any): string {
    // Simulação básica de token - não use em produção!
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ 
      sub: user.email, 
      name: user.name,
      iat: Date.now(),
      exp: Date.now() + 3600000 // 1 hora
    }));
    const signature = btoa('fake-signature-for-development-only');
    
    return `${header}.${payload}.${signature}`;
  }

  // Métodos para posts do blog
  getPosts(): Observable<BlogPost[]> {
    return this.apiService.get<BlogPost[]>('posts');
  }

  getPostById(id: number): Observable<BlogPost> {
    return this.apiService.get<BlogPost>(`posts/${id}`);
  }

  createPost(post: Partial<BlogPost>): Observable<BlogPost> {
    return this.apiService.post<BlogPost>('posts', post);
  }

  updatePost(post: BlogPost): Observable<BlogPost> {
    return this.apiService.put<BlogPost>(`posts/${post.id}`, post);
  }

  deletePost(id: number): Observable<void> {
    return this.apiService.delete<void>(`posts/${id}`);
  }

  // Método para verificar o captcha - delegado para AuthService
  validateCaptcha(captchaValue: string): Observable<{valid: boolean}> {
    return this.authService.validateCaptcha(captchaValue);
  }
}
