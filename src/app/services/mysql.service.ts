import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MySqlService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

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
   * Executa uma consulta no banco de dados MySQL
   * @param query String de consulta SQL
   * @param params Parâmetros para a consulta
   * @returns Observable com os resultados da consulta
   */
  executeQuery(query: string, params: any = []): Observable<any> {
    console.log('Executando query SQL:', query);
    console.log('Parâmetros:', params);
    
    // Direcionando diretamente para o arquivo PHP que executa consultas SQL
    return this.http.post(`${this.apiUrl}/database.php`, { query, params }, { headers: this.getHeaders() })
      .pipe(
        map((response: any) => {
          console.log('Resposta do servidor:', response);
          
          // Verificar se há erro na resposta
          if (response && response.error) {
            throw new Error(response.error);
          }
          
          return response.data || response;
        }),
        catchError(error => {
          console.error('Erro na execução da consulta SQL:', error);
          const errorMessage = error?.error?.error || error?.message || 'Erro ao acessar o banco de dados. Por favor, tente novamente.';
          console.error('Mensagem de erro:', errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Executa um procedimento armazenado no MySQL
   * @param procedure Nome do procedimento
   * @param params Parâmetros nomeados para o procedimento
   * @returns Observable com os resultados do procedimento
   */
  callProcedure(procedure: string, params: any = {}): Observable<any> {
    return this.http.post(`${this.apiUrl}/procedure.php`, { procedure, params }, { headers: this.getHeaders() })
      .pipe(
        map((response: any) => {
          // Se o procedimento retorna um conjunto de resultados, use o primeiro
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            return response.data[0];
          }
          return response.data;
        }),
        catchError(error => {
          console.error('Erro na execução do procedimento:', error);
          return throwError(() => new Error(error?.error?.error || 'Erro ao processar a solicitação. Por favor, tente novamente.'));
        })
      );
  }
}
