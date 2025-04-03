import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DatabaseService } from '../services/database.service';
import { CaptchaService } from '../services/captcha.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  captchaText: string = '';
  
  @ViewChild('captchaCanvas') captchaCanvas?: ElementRef<HTMLCanvasElement>;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private dbService: DatabaseService,
    private captchaService: CaptchaService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      captcha: ['', [Validators.required]]
    });
  }

  ngOnInit() {}

  ionViewDidEnter() {
    this.generateCaptcha();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.drawCaptcha();
    }, 100);
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
  get captcha() { return this.loginForm.get('captcha'); }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  generateCaptcha() {
    this.captchaService.generateCaptcha().subscribe({
      next: (response) => {
        this.captchaText = response.text;
        setTimeout(() => {
          this.drawCaptcha();
        }, 0);
      },
      error: (error) => {
        console.error('Erro ao gerar captcha:', error);
        this.captchaText = '12345';
        this.drawCaptcha();
      }
    });
  }

  drawCaptcha() {
    if (!this.captchaCanvas) return;
    
    const canvas = this.captchaCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Limpar o canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Definir o fundo
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Adicionar linhas de perturbação
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.strokeStyle = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
        ctx.stroke();
      }
      
      // Configurar o texto
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Desenhar cada caractere do captcha com uma leve rotação
      const text = this.captchaText;
      for (let i = 0; i < text.length; i++) {
        const charX = (canvas.width / (text.length + 1)) * (i + 1);
        const charY = canvas.height / 2 + Math.random() * 5 - 2.5;
        
        ctx.save();
        ctx.translate(charX, charY);
        ctx.rotate((Math.random() * 30 - 15) * Math.PI / 180);
        ctx.fillText(text.charAt(i), 0, 0);
        ctx.restore();
      }
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const enteredCaptcha = this.captcha?.value;
    
    // Verificar o captcha
    if (!this.captchaService.validateCaptcha(enteredCaptcha)) {
      this.errorMessage = 'Código de verificação incorreto. Tente novamente.';
      this.isSubmitting = false;
      this.generateCaptcha();
      this.loginForm.get('captcha')?.reset();
      return;
    }

    // Tentar login
    this.dbService.login(this.email?.value, this.password?.value)
      .subscribe({
        next: (user) => {
          this.isSubmitting = false;
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Falha ao fazer login. Verifique suas credenciais.';
          this.isSubmitting = false;
          this.generateCaptcha();
        }
      });
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
