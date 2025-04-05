import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
         IonItem, IonLabel, IonInput, IonNote, IonIcon, 
         IonSpinner, IonButtons, IonBackButton, 
         IonCheckbox, AlertController, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { eye, eyeOff, refreshOutline, homeOutline, lockClosed, shield, logoFacebook, logoGoogle, informationCircleOutline } from 'ionicons/icons';
import { DatabaseService } from '../services/database.service';
import { CaptchaService } from '../services/captcha.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonNote,
    IonIcon,
    IonSpinner,
    IonButtons,
    IonBackButton,
    IonCheckbox,
    IonCard,
    IonCardContent
  ]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  infoMessage: string = '';
  captchaText: string = '';
  redirectTo: string | null = null;
  
  @ViewChild('captchaCanvas') captchaCanvas?: ElementRef<HTMLCanvasElement>;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private dbService: DatabaseService,
    private captchaService: CaptchaService,
    private alertController: AlertController
  ) {
    // Registrar os ícones usados neste componente
    addIcons({
      refreshOutline, homeOutline, eye, eyeOff,
      lockClosed, shield, logoFacebook, logoGoogle,
      informationCircleOutline
    });
    
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      captcha: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    // Verificar se há parâmetros de redirecionamento
    this.route.queryParams.subscribe(params => {
      if (params['redirectTo']) {
        this.redirectTo = params['redirectTo'];
      }
      
      if (params['message']) {
        this.infoMessage = params['message'];
      }
    });
  }

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
  get rememberMe() { return this.loginForm.get('rememberMe'); }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  generateCaptcha() {
    // Simplificação extrema: gerar um código numérico simples diretamente no componente
    const captchaLength = 4;
    let result = '';
    const characters = '0123456789';
    
    for (let i = 0; i < captchaLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    this.captchaText = result;
    console.log('Captcha simplificado gerado:', this.captchaText);
    
    // Limpar o campo de entrada do captcha
    this.loginForm.get('captcha')?.reset();
    
    // Desenhar o captcha no canvas
    setTimeout(() => {
      this.drawCaptcha();
    }, 0);
  }

  drawCaptcha() {
    if (!this.captchaCanvas) return;
    
    const canvas = this.captchaCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Limpar o canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Definir um fundo simples
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Desenhar texto de forma mais simples e legível
      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Adicionar apenas algumas linhas simples para evitar confusão
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, Math.random() * canvas.height);
        ctx.lineTo(canvas.width, Math.random() * canvas.height);
        ctx.strokeStyle = '#aaa';
        ctx.stroke();
      }
      
      // Desenhar o texto centralizado sem rotações para maior legibilidade
      ctx.fillText(this.captchaText, canvas.width / 2, canvas.height / 2);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.infoMessage = '';

    const enteredCaptcha = this.captcha?.value;
    
    // Logs de debug
    console.log('Captcha digitado:', enteredCaptcha);
    console.log('Captcha esperado:', this.captchaText);
    
    // Versão super simplificada da validação
    if (enteredCaptcha !== this.captchaText) {
      this.errorMessage = 'Código de verificação incorreto. Tente novamente.';
      this.isSubmitting = false;
      this.generateCaptcha();
      return;
    }

    console.log('Tentando login com:', this.email?.value);
    
    // Tentar login
    this.dbService.login(this.email?.value, this.password?.value)
      .subscribe({
        next: (user) => {
          console.log('Login bem-sucedido:', user);
          // Se lembrar-me estiver marcado, guardamos o token por mais tempo
          if (this.rememberMe?.value) {
            localStorage.setItem('rememberMe', 'true');
          }
          this.isSubmitting = false;
          
          // Redirecionar para a página solicitada ou home
          if (this.redirectTo) {
            this.router.navigateByUrl(this.redirectTo);
          } else {
            this.router.navigate(['/home']);
          }
        },
        error: (error) => {
          console.error('Erro no login:', error);
          this.errorMessage = error.message || 'Falha ao fazer login. Verifique suas credenciais.';
          this.isSubmitting = false;
        }
      });
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  async forgotPassword() {
    const alert = await this.alertController.create({
      header: 'Recuperar Senha',
      message: 'Digite seu email para receber instruções de recuperação de senha',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Digite seu email'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: (data) => {
            if (data.email && data.email.trim() !== '') {
              this.sendRecoveryEmail(data.email);
              return true;
            } else {
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async sendRecoveryEmail(email: string) {
    // Simulação - Aqui você faria uma chamada real para sua API
    setTimeout(async () => {
      const alert = await this.alertController.create({
        header: 'Email Enviado',
        message: `Enviamos instruções de recuperação de senha para ${email}. Verifique sua caixa de entrada.`,
        buttons: ['OK']
      });
      await alert.present();
    }, 1000);
  }
}
