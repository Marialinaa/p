import { Injectable } from '@angular/core';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError, map, switchMap, take, tap, finalize } from 'rxjs/operators';
import { User } from '../models/user.model';
import { MySqlService } from './mysql.service';
import { CryptoService } from './crypto.service';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface UserOperationRequest {
  usuarioId: number;
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
  id?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private baseUrl = environment.apiUrl + '/users';

  constructor(
    private mysqlService: MySqlService,
    private cryptoService: CryptoService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  /**
   * Obtém usuários do sistema através do arquivo PHP
   * @returns Lista de usuários do PHP
   */
  getUsuarios() {
    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
    return this.http.get(`${this.apiUrl}/usuarios.php?usuarioId=${currentUser.id}`);
  }

  /**
   * Obtém todos os usuários do sistema (via API HTTP)
   * @returns Lista de usuários
   */
  getUsers(): Observable<User[]> {
    return this.http.get<any>(`${this.apiUrl}/users`, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          const users = response.users || [];
          return users.map((user: any) => this.mapUserFromApi(user));
        }),
        catchError(error => {
          console.error('Erro ao obter usuários:', error);
          return throwError(() => new Error('Não foi possível carregar a lista de usuários.'));
        })
      );
  }

  /**
   * Obtém um usuário por ID (via API HTTP)
   * @param id ID do usuário
   * @returns Dados do usuário
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/users/${id}`, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          if (!response || !response.user) {
            throw new Error('Usuário não encontrado');
          }
          return this.mapUserFromApi(response.user);
        }),
        catchError(error => {
          console.error('Erro ao obter usuário por ID:', error);
          return throwError(() => new Error(error.message || 'Erro ao buscar dados do usuário.'));
        })
      );
  }

  /**
   * Cria um novo usuário (via API HTTP)
   * @param userData Dados do usuário a ser criado
   * @returns Observable com o usuário criado
   */
  createUser(userData: Partial<User>): Observable<User> {
    return this.authService.isAdmin().pipe(
      switchMap(isAdmin => {
        if (!isAdmin) {
          return throwError(() => new Error('Você não tem permissão para criar usuários.'));
        }

        // Se uma senha foi fornecida, fazer hash
        if (userData.password) {
          return from(this.cryptoService.hashPassword(userData.password)).pipe(
            switchMap(hashedPassword => {
              const data = {
                ...userData,
                password: hashedPassword
              };
              return this.http.post<any>(`${this.apiUrl}/users`, data, { headers: this.getHeaders() });
            })
          );
        } else {
          return this.http.post<any>(`${this.apiUrl}/users`, userData, { headers: this.getHeaders() });
        }
      }),
      map(response => {
        if (!response || !response.userId) {
          throw new Error('Falha ao criar usuário');
        }
        return {
          id: response.userId,
          name: userData.name || '',
          email: userData.email || '',
          role: userData.role || 'user'
        } as User;
      }),
      catchError(error => {
        console.error('Erro ao criar usuário:', error);
        return throwError(() => new Error(error.message || 'Não foi possível criar o usuário.'));
      })
    );
  }

  /**
   * Atualiza os dados de um usuário existente
   * @param id ID do usuário
   * @param userData Dados do usuário a serem atualizados
   * @returns Observable com o resultado da operação
   */
  updateUser(id: number, userData: Partial<User>): Observable<any> {
    console.log('Iniciando atualização de usuário com ID:', id, 'Dados:', userData);
    
    return this.authService.isAdmin().pipe(
      switchMap(isAdmin => {
        if (!isAdmin) {
          return throwError(() => new Error('Você não tem permissão para atualizar usuários.'));
        }
        
        const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
        
        // Usar o método direto para MySQL que já existe
        return this.updateUserInDB({
          id: id,
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          isActive: userData.isActive,
          usuarioId: currentUser.id
        });
      }),
      tap(result => {
        console.log('Usuário atualizado com sucesso:', result);
      }),
      catchError(error => {
        console.error('Erro ao atualizar usuário:', error);
        return throwError(() => new Error(error.message || 'Não foi possível atualizar o usuário.'));
      })
    );
  }

  /**
   * Exclui um usuário do sistema (via API HTTP)
   * @param id ID do usuário a ser excluído
   * @returns Observable com o resultado da operação
   */
  deleteUser(id: number): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      switchMap(currentUser => {
        if (!currentUser || !currentUser.id) {
          return throwError(() => new Error('Usuário não autenticado.'));
        }
        
        return this.authService.isAdmin().pipe(
          switchMap(isAdmin => {
            if (!isAdmin) {
              return throwError(() => new Error('Você não tem permissão para excluir usuários.'));
            }
            return this.http.delete<any>(`${this.apiUrl}/users/${id}`, { headers: this.getHeaders() });
          })
        );
      }),
      map(result => {
        if (!result || result.success !== true) {
          throw new Error('Falha ao excluir usuário');
        }
        
        return true;
      }),
      catchError(error => {
        console.error('Erro ao excluir usuário:', error);
        return throwError(() => new Error(error.message || 'Não foi possível excluir o usuário.'));
      })
    );
  }

  /**
   * Mapeia um usuário vindo da API para o formato do modelo
   */
  private mapUserFromApi(apiUser: any): User {
    return {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      role: apiUser.role,
      isActive: apiUser.is_active === 1,
      twoFactorEnabled: apiUser.two_factor_enabled === 1,
      lastLogin: apiUser.last_login ? new Date(apiUser.last_login) : undefined,
      createdAt: apiUser.created_at ? new Date(apiUser.created_at) : undefined,
      updatedAt: apiUser.updated_at ? new Date(apiUser.updated_at) : undefined
    };
  }

  /**
   * Busca todos os usuários do sistema (via MySQL direto)
   */
  getUsersFromDB(): Observable<User[]> {
    const query = `SELECT * FROM usuarios`;
    return this.mysqlService.executeQuery(query).pipe(
      map((users: any[]) => {
        return users.map(user => ({
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.tipo,
          isActive: Boolean(user.ativo),
          lastLogin: user.ultimo_login ? new Date(user.ultimo_login) : undefined,
          createdAt: user.created_at ? new Date(user.created_at) : undefined,
          updatedAt: user.updated_at ? new Date(user.updated_at) : undefined
        } as User));
      })
    );
  }

  /**
   * Busca um usuário específico por ID (via MySQL direto)
   */
  getUserFromDB(id: number): Observable<User> {
    const query = `SELECT * FROM usuarios WHERE id = ?`;
    return this.mysqlService.executeQuery(query, [id]).pipe(
      map((users: any[]) => {
        if (users && users.length > 0) {
          const user = users[0];
          return {
            id: user.id,
            name: user.nome,
            email: user.email,
            role: user.tipo,
            isActive: Boolean(user.ativo),
            lastLogin: user.ultimo_login ? new Date(user.ultimo_login) : undefined,
            createdAt: user.created_at ? new Date(user.created_at) : undefined,
            updatedAt: user.updated_at ? new Date(user.updated_at) : undefined
          } as User;
        }
        throw new Error('Usuário não encontrado');
      })
    );
  }

  /**
   * Adiciona um novo usuário (via MySQL direto)
   */
  addUsuario(data: UserOperationRequest): Observable<any> {
    console.log('Iniciando adição de usuário com dados:', data);
    
    const query = `
      INSERT INTO usuarios (nome, email, senha, tipo, ativo, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, NOW(), ?)
    `;

    const params = [
      data.name,
      data.email,
      data.password, // Idealmente deveria ser hash
      data.role || 'user',
      data.isActive !== undefined ? data.isActive : true,
      data.usuarioId
    ];

    console.log('Executando query de inserção com parâmetros:', params);
    
    return this.mysqlService.executeQuery(query, params).pipe(
      tap(result => {
        console.log('Resultado da inserção de usuário:', result);
      }),
      catchError(error => {
        console.error('Erro ao adicionar usuário:', error);
        return throwError(() => new Error(`Falha ao adicionar usuário: ${error.message || 'Erro desconhecido'}`));
      })
    );
  }

  /**
   * Atualiza um usuário existente (via MySQL direto)
   */
  updateUserInDB(data: UserOperationRequest & { id: number }): Observable<any> {
    let query = `
      UPDATE usuarios 
      SET nome = ?, 
          email = ?, 
          tipo = ?, 
          ativo = ?, 
          updated_at = NOW(), 
          updated_by = ?
    `;
    
    let params: any[] = [
      data.name,
      data.email,
      data.role,
      data.isActive,
      data.usuarioId
    ];

    // Se uma senha for fornecida, atualiza a senha
    if (data.password && data.password.trim() !== '') {
      query += `, senha = ?`;
      params.push(data.password);
    }

    query += ` WHERE id = ?`;
    params.push(data.id);

    return this.mysqlService.executeQuery(query, params);
  }

  /**
   * Exclui um usuário (via MySQL direto)
   */
  deleteUserFromDB(id: number): Observable<any> {
    const query = `DELETE FROM usuarios WHERE id = ?`;
    return this.mysqlService.executeQuery(query, [id]);
  }
}
