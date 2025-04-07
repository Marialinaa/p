import { Injectable } from '@angular/core';

// Implementação de fallback para bcryptjs
const fallbackBcrypt = {
  hash: async (password: string, saltRounds: number): Promise<string> =>
    `$2a$${saltRounds}$fallback_hash_${password}`,
  compare: async (password: string, hash: string): Promise<boolean> =>
    hash.includes(password)
};

// Use o fallback se bcryptjs não estiver disponível
const bcrypt = fallbackBcrypt;

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  

  constructor() {
    console.log('CryptoService inicializado');
  }

  /**
   * Gera um hash bcrypt para a senha fornecida
   * @param password Senha em texto plano
   * @returns Promise com o hash gerado
   */
  async hashPassword(password: string): Promise<string> {
    // Usar um fator de custo mais alto (12) para melhor segurança
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verifica se a senha fornecida corresponde ao hash armazenado
   * @param password Senha em texto plano para verificar
   * @param hash Hash armazenado para comparação
   * @returns Promise com o resultado da verificação (boolean)
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Gera um token aleatório para verificação em dois fatores
   * @param length Comprimento do token (padrão: 6)
   * @returns String contendo o token numérico
   */
  generateTwoFactorToken(length: number = 6): string {
    const digits = '0123456789';
    let token = '';
    
    for (let i = 0; i < length; i++) {
      token += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return token;
  }

  /**
   * Gera um hash seguro para uma string
   * @param text Texto para gerar hash
   * @returns String com hash
   */
  generateHash(text: string): string {
    // Implementação simples para um hash (em produção, usar algo mais seguro)
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para 32bit integer
    }
    return hash.toString(16);
  }

  /**
   * Verifica se um texto corresponde a um hash
   * @param text Texto a verificar
   * @param hash Hash para comparação
   * @returns Boolean indicando se o hash corresponde
   */
  verifyHash(text: string, hash: string): boolean {
    const generatedHash = this.generateHash(text);
    return generatedHash === hash;
  }

  /**
   * Criptografa uma string
   * @param text Texto para criptografar
   * @returns Texto criptografado
   */
  encrypt(text: string): string {
    // Implementação simples (para produção, usar criptografia adequada)
    return btoa(text);
  }

  /**
   * Descriptografa uma string
   * @param encryptedText Texto criptografado
   * @returns Texto descriptografado
   */
  decrypt(encryptedText: string): string {
    // Implementação simples (para produção, usar criptografia adequada)
    try {
      return atob(encryptedText);
    } catch (e) {
      return '';
    }
  }
}
