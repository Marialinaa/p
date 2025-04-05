import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CaptchaService {
  constructor() {}

  // Método mantido para compatibilidade, mas não é mais usado diretamente
  generateCaptcha(): Observable<{text: string}> {
    const captchaLength = 4;
    let result = '';
    const characters = '0123456789';
    
    for (let i = 0; i < captchaLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return of({ text: result });
  }
}
