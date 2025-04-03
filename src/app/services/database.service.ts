import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { User } from '../models/user.model'; // Importar User do arquivo correto

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
  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  // Métodos para usuários
  getUsers(): Observable<User[]> {
    return this.apiService.get<User[]>('users');
  }

  getUserById(id: number): Observable<User> {
    return this.apiService.get<User>(`users/${id}`);
  }

  getUserByEmail(email: string): Observable<User> {
    return this.apiService.get<User>(`users/email/${email}`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.apiService.post<User>('users', user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.apiService.put<User>(`users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.apiService.delete<void>(`users/${id}`);
  }

  // Autenticação - delegado para AuthService
  login(email: string, password: string): Observable<any> {
    return this.authService.login(email, password, ''); // Captcha é tratado separadamente
  }

  logout(): void {
    this.authService.logout();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
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

  // Propriedade para acessar o usuário atual
  get currentUser$() {
    return this.authService.currentUser$;
  }

  // Método para verificar o captcha - delegado para AuthService
  validateCaptcha(captchaValue: string): Observable<{valid: boolean}> {
    return this.authService.validateCaptcha(captchaValue);
  }
}
