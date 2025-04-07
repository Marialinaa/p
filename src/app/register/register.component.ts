import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
         IonItem, IonLabel, IonInput, IonNote, IonIcon, 
         IonSpinner, IonButtons, IonBackButton, AlertController, IonCheckbox } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { eye, eyeOff, refreshOutline, homeOutline, personOutline, mailOutline, lockClosed } from 'ionicons/icons';
import { DatabaseService } from '../services/database.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
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
    IonCheckbox
  ]
})
export class RegisterComponent {
  registerForm: FormGroup;
  showPassword: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  passwordStrength: number = 0;
  passwordFeedback: string = '';
  isSubmitAttempted: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private dbService: DatabaseService,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    // Registrar os ícones usados neste componente
    addIcons({
      refreshOutline, homeOutline, eye, eyeOff,
      lockClosed, personOutline, mailOutline
    });
    
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        this.createPasswordStrengthValidator()
      ]],
      confirmPassword: ['', [Validators.required]],
      termsAccepted: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get termsAccepted() { return this.registerForm.get('termsAccepted'); }

  createPasswordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: boolean} | null => {
      const value = control.value;
      
      if (!value) {
        this.passwordStrength = 0;
        this.passwordFeedback = '';
        return null;
      }

      // Verificar a força da senha
      const hasUpperCase = /[A-Z]+/.test(value);
      const hasLowerCase = /[a-z]+/.test(value);
      const hasNumeric = /[0-9]+/.test(value);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);
      
      // Calcular a força
      this.passwordStrength = 0;
      if (value.length >= 6) this.passwordStrength += 1;
      if (value.length >= 10) this.passwordStrength += 1;
      if (hasUpperCase) this.passwordStrength += 1;
      if (hasLowerCase) this.passwordStrength += 1;
      if (hasNumeric) this.passwordStrength += 1;
      if (hasSpecialChar) this.passwordStrength += 1;
      
      // Feedback com base na força
      if (this.passwordStrength <= 2) {
        this.passwordFeedback = 'Fraca';
      } else if (this.passwordStrength <= 4) {
        this.passwordFeedback = 'Média';
      } else if (this.passwordStrength <= 5) {
        this.passwordFeedback = 'Forte';
      } else {
        this.passwordFeedback = 'Muito Forte';
      }
      
      // Para validação, vamos considerar inválido se a senha for muito fraca
      const passwordValid = this.passwordStrength >= 3;
      return !passwordValid ? { passwordStrength: true } : null;
    }
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  getStrengthClass(): string {
    if (this.passwordStrength === 1) return 'weak';
    if (this.passwordStrength === 2) return 'medium';
    if (this.passwordStrength === 3) return 'strong';
    if (this.passwordStrength === 4) return 'very-strong';
    return '';
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength === 1) return 'Fraca';
    if (this.passwordStrength === 2) return 'Média';
    if (this.passwordStrength === 3) return 'Forte';
    if (this.passwordStrength === 4) return 'Muito Forte';
    return '';
  }

  logFormState() {
    
    if (this.registerForm.invalid) {
      console.log('Erros do formulário:', this.registerForm.errors);
      console.log('Nome válido?', this.name?.valid, this.name?.errors);
      console.log('Email válido?', this.email?.valid, this.email?.errors);
      console.log('Senha válida?', this.password?.valid, this.password?.errors);
      console.log('Confirmação válida?', this.confirmPassword?.valid, this.confirmPassword?.errors);
      console.log('Termos aceitos?', this.termsAccepted?.valid, this.termsAccepted?.value);
      
      // Força a verificação de todos os campos para mostrar erros
      this.isSubmitAttempted = true;
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsDirty();
        control?.markAsTouched();
      });
    } else {
      console.log('Formulário está válido, tentando enviar...');
      // Aqui você poderia acionar o envio do formulário
      // this.onSubmit();
    }
  }

  onSubmit() {
    console.log('Método onSubmit() chamado');
    this.isSubmitAttempted = true;
    
    if (this.registerForm.invalid) {
      console.log('Formulário inválido, checando erros:', this.registerForm.errors);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const userData = {
      name: this.name?.value,
      email: this.email?.value,
      password: this.password?.value
    };

    console.log('Enviando dados do usuário para registro:', userData);

    // Usar o serviço de autenticação para registro com o backend PHP
    this.authService.register(userData).subscribe({
      next: (response) => {
        console.log('Usuário registrado com sucesso:', response);
        this.showSuccessAlert();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Erro no registro:', error);
        this.errorMessage = error.message || 'Falha ao registrar usuário. Tente novamente.';
        this.isSubmitting = false;
      }
    });
  }

  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: 'Registro Concluído',
      message: 'Seu cadastro foi realizado com sucesso! Agora você pode fazer login.',
      buttons: [{
        text: 'Ir para Login',
        handler: () => {
          this.router.navigate(['/login']);
        }
      }]
    });

    await alert.present();
  }

  getStrengthColor() {
    if (this.passwordStrength <= 2) {
      return 'danger';
    } else if (this.passwordStrength <= 4) {
      return 'warning';
    } else {
      return 'success';
    }
  }

  async showTerms() {
    const alert = await this.alertController.create({
      header: 'Termos de Uso',
      message: 'Estes são os termos de uso da nossa plataforma. Ao aceitar, você concorda em seguir todas as regras e políticas estabelecidas.',
      buttons: ['OK']
    });

    await alert.present();
  }

  async showPrivacyPolicy() {
    const alert = await this.alertController.create({
      header: 'Política de Privacidade',
      message: 'Valorizamos sua privacidade. Seus dados pessoais serão usados apenas para melhorar a experiência do usuário e não serão compartilhados com terceiros sem seu consentimento explícito.',
      buttons: ['OK']
    });

    await alert.present();
  }

  async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Erro',
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  getFormControlErrorDetails(control: AbstractControl | null): string {
    if (!control || !control.errors) return '';
    
    const errors = [];
    
    if (control.errors['required']) errors.push('campo obrigatório');
    if (control.errors['minlength']) errors.push(`mínimo de ${control.errors['minlength'].requiredLength} caracteres`);
    if (control.errors['email']) errors.push('formato de email inválido');
    if (control.errors['passwordStrength']) errors.push('senha não atende os requisitos mínimos');
    
    return errors.join(', ');
  }
}
