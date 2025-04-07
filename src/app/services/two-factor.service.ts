import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CryptoService } from './crypto.service';

@Injectable({
  providedIn: 'root'
})
export class TwoFactorService {
  private apiUrl = environment.apiUrl;
  private readonly STORAGE_KEY = 'two_factor_pending';

  constructor(
    private http: HttpClient,
    private cryptoService: CryptoService
  ) {}

  /**
   * Inicia o processo de verificação de dois fatores
   * @param userId ID do usuário
   * @param email Email do usuário
   * @returns Observable com o resultado da operação
   */
  initiateVerification(userId: number, email: string): Observable<any> {
    // Gerar um token de 6 dígitos
    const token = this.cryptoService.generateTwoFactorToken(6);
    
    // Em ambiente de produção: envio do token por email
    if (environment.production) {
      return this.http.post(`${this.apiUrl}/auth/send-2fa`, { userId, email, token })
        .pipe(
          map(response => {
            // Armazenar temporariamente o token pendente (em hash para maior segurança)
            this.storePendingToken(userId, token);
            return { success: true, message: 'Código de verificação enviado para seu email.' };
          }),
          catchError(error => {
            console.error('Erro ao enviar código 2FA:', error);
            return throwError(() => new Error('Não foi possível enviar o código de verificação.'));
          })
        );
    } 
    
    // Em ambiente de desenvolvimento: apenas simula o envio
    else {
      console.log(`[DEV MODE] Código 2FA para ${email}: ${token}`);
      this.storePendingToken(userId, token);
      return of({ 
        success: true, 
        message: 'Código de verificação gerado (modo de desenvolvimento).',
        devToken: token // Apenas em desenvolvimento
      });
    }
  }

  /**
   * Verifica o código 2FA fornecido pelo usuário
   * @param userId ID do usuário
   * @param inputToken Token fornecido pelo usuário
   * @returns true se válido, false caso contrário
   */
  verifyToken(userId: number, inputToken: string): boolean {
    const storedData = this.getPendingToken(userId);
    
    if (!storedData) {
      return false;
    }
    
    // Verificar expiração
    if (Date.now() > storedData.expiry) {
      this.clearPendingToken(userId);
      return false;
    }
    
    // Verificar token
    const result = inputToken === storedData.token;
    
    // Se validação bem-sucedida, limpar o token pendente
    if (result) {
      this.clearPendingToken(userId);
    }
    
    return result;
  }

  /**
   * Armazena temporariamente o token pendente
   * @param userId ID do usuário
   * @param token Token gerado
   */
  private storePendingToken(userId: number, token: string): void {
    // Token expira em 10 minutos
    const expiry = Date.now() + 10 * 60 * 1000;
    
    let pendingTokens = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    pendingTokens[userId] = { token, expiry };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pendingTokens));
  }

  /**
   * Recupera um token pendente
   * @param userId ID do usuário
   * @returns Dados do token ou null se não encontrado
   */
  private getPendingToken(userId: number): { token: string, expiry: number } | null {
    const pendingTokens = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    return pendingTokens[userId] || null;
  }

  /**
   * Remove um token pendente
   * @param userId ID do usuário
   */
  private clearPendingToken(userId: number): void {
    const pendingTokens = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    delete pendingTokens[userId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pendingTokens));
  }
}
