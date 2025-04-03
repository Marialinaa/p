import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface CaptchaResponse {
  text: string;
  // Outros campos se necessário
}

@Injectable({
  providedIn: 'root'
})
export class CaptchaService {
  private currentCaptcha: string = '';

  constructor() { }

  generateCaptcha(): Observable<CaptchaResponse> {
    // Gerar um código captcha aleatório de 5 caracteres
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let captcha = '';
    
    for (let i = 0; i < 5; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    this.currentCaptcha = captcha;
    return of({ text: captcha });
  }

  validateCaptcha(input: string): boolean {
    // Garantir retorno boolean adicionando !! para conversão explícita
    return !!input && input.toLowerCase() === this.currentCaptcha.toLowerCase();
  }
}
