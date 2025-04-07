import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
         IonItem, IonLabel, IonInput, IonNote, IonIcon, 
         IonSpinner, IonButtons, AlertController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { shieldOutline, lockClosedOutline, refreshOutline } from 'ionicons/icons';

@Component({
  selector: 'app-two-factor',
  templateUrl: './two-factor.component.html',
  styleUrls: ['./two-factor.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    IonButtons
  ]
})
export class TwoFactorComponent implements OnInit, OnDestroy {
  twoFactorForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  userId: number | null = null;
  redirectTo: string | null = null;
  remainingTime = 600; // 10 minutos em segundos
  timerInterval: any;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController
  ) {
    // Registrar ícones
    addIcons({shieldOutline,lockClosedOutline,refreshOutline});

    this.twoFactorForm = this.formBuilder.group({
      verificationCode: ['', [
        Validators.required, 
        Validators.pattern(/^\d{6}$/), // Deve ser um código de 6 dígitos
        Validators.minLength(6),
        Validators.maxLength(6)
      ]]
    });
  }

  ngOnInit() {
    // Obter parâmetros da URL
    this.route.queryParams.subscribe(params => {
      this.userId = Number(params['userId']) || null;
      this.redirectTo = params['redirectTo'] || '/home';
      
      if (!this.userId) {
        // Redirecionar para página de login se não houver ID de usuário
        this.router.navigate(['/login']);
      }
    });

    // Iniciar o timer de contagem regressiva
    this.startTimer();
  }

  ngOnDestroy() {
    // Limpar o timer quando o componente for destruído
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.remainingTime--;
      
      if (this.remainingTime <= 0) {
        clearInterval(this.timerInterval);
        this.showExpiredAlert();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async showExpiredAlert() {
    const alert = await this.alertController.create({
      header: 'Código Expirado',
      message: 'O código de verificação expirou. Por favor, faça login novamente.',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.router.navigate(['/login']);
        }
      }]
    });

    await alert.present();
  }

  onSubmit() {
    if (this.twoFactorForm.invalid || !this.userId) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const verificationCode = this.twoFactorForm.get('verificationCode')?.value;

    this.authService.verifyTwoFactor(this.userId, verificationCode).subscribe({
      next: (result) => {
        if (result.success) {
          // Limpar o timer
          if (this.timerInterval) {
            clearInterval(this.timerInterval);
          }
          
          // Redirecionar para a página solicitada
          this.router.navigate([this.redirectTo || '/home']);
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'Código de verificação inválido. Tente novamente.';
        this.isSubmitting = false;
      }
    });
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
