import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DatabaseService } from '../services/database.service';
import { User } from '../models/user.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-crud',
  templateUrl: './user-crud.component.html',
  styleUrls: ['./user-crud.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class UserCrudComponent implements OnInit {
  userForm: FormGroup;
  users: User[] = [];
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  showPassword: boolean = false;
  editMode: boolean = false;
  currentUserId?: number;

  constructor(
    private formBuilder: FormBuilder,
    private dbService: DatabaseService,
    private alertController: AlertController,
    private router: Router
  ) {
    this.userForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        this.createPasswordStrengthValidator()
      ]]
    });
  }

  ngOnInit() {
    this.checkAuthStatus();
    this.loadUsers();
  }

  checkAuthStatus() {
    if (!this.dbService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  get name() { return this.userForm.get('name'); }
  get email() { return this.userForm.get('email'); }
  get password() { return this.userForm.get('password'); }

  // Validador para verificar força da senha
  createPasswordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: boolean} | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }

      const hasUpperCase = /[A-Z]+/.test(value);
      const hasLowerCase = /[a-z]+/.test(value);
      const hasNumeric = /[0-9]+/.test(value);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);

      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

      return !passwordValid ? { passwordStrength: true } : null;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  loadUsers() {
    this.isLoading = true;
    this.dbService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.userForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    const userData = {
      name: this.name?.value,
      email: this.email?.value,
      password: this.password?.value
    };

    // No mundo real, aqui seria feito um update do usuário
    // Como estamos simulando, vamos apenas criar um novo
    this.dbService.createUser(userData).subscribe({
      next: (user) => {
        this.resetForm();
        this.loadUsers();
        this.isSubmitting = false;
      },
      error: (error) => {
        this.showError(error.message || 'Erro ao processar usuário.');
        this.isSubmitting = false;
      }
    });
  }

  resetForm() {
    this.userForm.reset();
    this.editMode = false;
    this.currentUserId = undefined;
    
    // No modo de edição, a senha não seria obrigatória
    if (this.editMode) {
      this.password?.setValidators(null);
    } else {
      this.password?.setValidators([
        Validators.required,
        Validators.minLength(6),
        this.createPasswordStrengthValidator()
      ]);
    }
    this.password?.updateValueAndValidity();
  }

  editUser(user: User) {
    this.editMode = true;
    this.currentUserId = user.id;
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      // Não preenchemos a senha por segurança
      password: ''
    });
    
    // Em um sistema real, poderíamos tornar a senha opcional no modo de edição
    this.password?.setValidators([
      Validators.minLength(6),
      this.createPasswordStrengthValidator()
    ]);
    this.password?.updateValueAndValidity();
  }

  async deleteUser(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o usuário "${user.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          role: 'confirm',
          handler: () => {
            // Em um sistema real, aqui chamaríamos um método para excluir o usuário
            // Como estamos simulando, vamos apenas recarregar a lista
            setTimeout(() => {
              this.loadUsers();
            }, 500);
            
            // Mostrar mensagem de sucesso
            this.showSuccess(`Usuário ${user.name} excluído com sucesso!`);
          }
        }
      ]
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

  async showSuccess(message: string) {
    const alert = await this.alertController.create({
      header: 'Sucesso',
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }
}
