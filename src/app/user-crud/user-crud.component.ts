import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, finalize } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { MySqlService } from '../services/mysql.service';

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
  isAdmin: boolean = false;
  roles = [
    { value: 'user', label: 'Usuário' },
    { value: 'editor', label: 'Editor' },
    { value: 'admin', label: 'Administrador' }
  ];
  loggedInUsers: User[] = []; // Nova propriedade para armazenar usuários logados

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router,
    private mysqlService: MySqlService // Adicionar MySqlService para garantir acesso direto ao banco
  ) {
    this.userForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [this.createPasswordStrengthValidator()]],
      role: ['user', [Validators.required]],
      isActive: [true]
    });
  }

  ngOnInit() {
    // Verificar se o usuário é administrador usando o AuthService
    this.authService.isAdmin().subscribe(isAdmin => {
      this.isAdmin = isAdmin;
      
      // Carregar usuários independentemente de ser admin ou não
      this.loadUsers();
      
      // Carregar usuários logados atualmente
      this.loadLoggedInUsers();
      
      // Obter o ID do usuário atual
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.currentUserId = user.id;
        }
      });
    });
  }

  get name() { return this.userForm.get('name'); }
  get email() { return this.userForm.get('email'); }
  get password() { return this.userForm.get('password'); }
  get role() { return this.userForm.get('role'); }
  get isActive() { return this.userForm.get('isActive'); }

  createPasswordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: boolean} | null => {
      const value = control.value;
      if (this.editMode && (!value || value.trim() === '')) return null;
      if (!this.editMode && (!value || value.trim() === '')) return { required: true };

      const hasUpperCase = /[A-Z]+/.test(value);
      const hasLowerCase = /[a-z]+/.test(value);
      const hasNumeric = /[0-9]+/.test(value);
      const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(value);
      const hasMinLength = value.length >= 8;

      return hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar && hasMinLength ? null : { passwordStrength: true };
    };
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async loadUsers() {
    const loading = await this.loadingController.create({ message: 'Carregando usuários...', spinner: 'crescent' });
    await loading.present();
    this.isLoading = true;

    // Acessar diretamente com MySqlService para garantir a comunicação com o banco
    const query = "SELECT * FROM usuarios";
    this.mysqlService.executeQuery(query).pipe(
      finalize(() => {
        this.isLoading = false;
        loading.dismiss();
      })
    ).subscribe({
      next: (res: any[]) => {
        console.log('Usuários carregados do banco:', res);
        this.users = res.map(user => ({
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.tipo,
          isActive: Boolean(user.ativo),
          lastLogin: user.ultimo_login ? new Date(user.ultimo_login) : undefined
        } as User));
      },
      error: async (err: any) => {
        console.error('Erro ao buscar usuários do banco:', err);
        const toast = await this.toastController.create({
          message: 'Erro ao carregar usuários do banco de dados.', 
          duration: 3000, 
          position: 'bottom', 
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  // Novo método para carregar usuários logados
  async loadLoggedInUsers() {
    const loading = await this.loadingController.create({ message: 'Carregando usuários logados...', spinner: 'crescent' });
    await loading.present();

    // Query para buscar usuários com lastLogin recente (últimas 24 horas)
    const query = `
      SELECT * FROM usuarios 
      WHERE ultimo_login IS NOT NULL 
      AND ultimo_login > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY ultimo_login DESC
    `;

    this.mysqlService.executeQuery(query).pipe(
      finalize(() => loading.dismiss())
    ).subscribe({
      next: (res: any[]) => {
        console.log('Usuários logados recentemente:', res);
        this.loggedInUsers = res.map(user => ({
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.tipo,
          isActive: Boolean(user.ativo),
          lastLogin: user.ultimo_login ? new Date(user.ultimo_login) : undefined
        } as User));
      },
      error: async (err: any) => {
        console.error('Erro ao buscar usuários logados:', err);
        const toast = await this.toastController.create({
          message: 'Erro ao carregar usuários logados.', 
          duration: 3000, 
          position: 'bottom', 
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  async onSubmit() {
    if (this.userForm.invalid) return;

    this.isSubmitting = true;
    const loading = await this.loadingController.create({ 
      message: this.editMode ? 'Atualizando usuário...' : 'Criando usuário...', 
      spinner: 'crescent'
    });
    await loading.present();

    const userData = {
      name: this.name?.value,
      email: this.email?.value,
      password: this.password?.value,
      role: this.role?.value,
      isActive: this.isActive?.value
    };

    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
    
    // Adicionar logs para debugging
    console.log('Salvando dados do usuário no banco:', userData);
    console.log('Modo de edição:', this.editMode);
    console.log('ID atual (se em modo de edição):', this.currentUserId);

    // Preparar a query SQL diretamente para garantir a atualização no banco
    let query = '';
    let params: any[] = [];

    if (this.editMode && this.currentUserId) {
      console.log('Atualizando usuário existente com ID:', this.currentUserId);
      
      query = `
        UPDATE usuarios 
        SET nome = ?, 
            email = ?, 
            tipo = ?, 
            ativo = ?, 
            updated_at = NOW()
      `;
      
      params = [
        userData.name,
        userData.email,
        userData.role,
        userData.isActive ? 1 : 0
      ];
      
      // Se a senha for fornecida, atualizá-la também
      if (userData.password && userData.password.trim() !== '') {
        query += `, senha = ?`;
        params.push(userData.password);
      }
      
      query += ` WHERE id = ?`;
      params.push(this.currentUserId);
      
      this.mysqlService.executeQuery(query, params).pipe(
        finalize(() => { 
          this.isSubmitting = false; 
          loading.dismiss(); 
        })
      ).subscribe({
        next: async (result) => {
          console.log('Usuário atualizado no banco com sucesso:', result);
          const toast = await this.toastController.create({ 
            message: 'Usuário atualizado no banco de dados!', 
            duration: 3000, 
            position: 'bottom', 
            color: 'success' 
          });
          toast.present();
          this.resetForm();
          this.loadUsers();
          this.loadLoggedInUsers(); // Recarregar usuários logados após atualização
        },
        error: async (err) => {
          console.error('Erro ao atualizar usuário no banco:', err);
          const alert = await this.alertController.create({ 
            header: 'Erro no Banco de Dados', 
            message: err.message || 'Erro ao atualizar usuário no banco de dados.', 
            buttons: ['OK'] 
          });
          alert.present();
        }
      });
    } else {
      console.log('Criando novo usuário no banco');
      
      query = `
        INSERT INTO usuarios (nome, email, senha, tipo, ativo, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      
      params = [
        userData.name,
        userData.email,
        userData.password,
        userData.role,
        userData.isActive ? 1 : 0
      ];
      
      this.mysqlService.executeQuery(query, params).pipe(
        finalize(() => { 
          this.isSubmitting = false; 
          loading.dismiss(); 
        })
      ).subscribe({
        next: async (result) => {
          console.log('Usuário criado no banco com sucesso:', result);
          const toast = await this.toastController.create({ 
            message: 'Usuário criado no banco de dados!', 
            duration: 3000, 
            position: 'bottom', 
            color: 'success' 
          });
          toast.present();
          this.resetForm();
          this.loadUsers();
        },
        error: async (err) => {
          console.error('Erro ao criar usuário no banco:', err);
          const alert = await this.alertController.create({ 
            header: 'Erro no Banco de Dados', 
            message: err.message || 'Erro ao criar usuário no banco de dados.', 
            buttons: ['OK'] 
          });
          alert.present();
        }
      });
    }
  }

  resetForm() {
    this.userForm.reset({ role: 'user', isActive: true });
    this.editMode = false;
    this.currentUserId = undefined;
    this.password?.setValidators(this.editMode ? null : [Validators.required, this.createPasswordStrengthValidator()]);
    this.password?.updateValueAndValidity();
  }

  editUser(user: User) {
    this.editMode = true;
    this.currentUserId = user.id;
    this.userForm.patchValue({ 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      isActive: user.isActive, 
      password: '' 
    });
    this.password?.setValidators([this.createPasswordStrengthValidator()]);
    this.password?.updateValueAndValidity();
  }

  async deleteUser(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: `Excluir usuário "${user.name}" do banco de dados?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'confirm',
          cssClass: 'danger',
          handler: async () => {
            const loading = await this.loadingController.create({ message: 'Excluindo...', spinner: 'crescent' });
            await loading.present();
            
            // Executar query de exclusão diretamente no banco
            const query = `DELETE FROM usuarios WHERE id = ?`;
            this.mysqlService.executeQuery(query, [user.id]).pipe(
              finalize(() => loading.dismiss())
            ).subscribe({
              next: async () => {
                console.log(`Usuário ${user.name} excluído do banco com sucesso!`);
                const toast = await this.toastController.create({ 
                  message: `Usuário ${user.name} excluído do banco de dados!`, 
                  duration: 3000, 
                  position: 'bottom', 
                  color: 'success' 
                });
                toast.present();
                this.loadUsers();
                this.loadLoggedInUsers(); // Recarregar usuários logados após exclusão
              },
              error: async (err: any) => {
                console.error('Erro ao excluir usuário do banco:', err);
                const alert = await this.alertController.create({ 
                  header: 'Erro no Banco de Dados', 
                  message: err.message || 'Erro ao excluir usuário do banco de dados.', 
                  buttons: ['OK'] 
                });
                alert.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // Novo método para forçar logout de um usuário
  async forceLogout(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirmar Ação',
      message: `Forçar logout do usuário "${user.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desconectar',
          role: 'confirm',
          handler: async () => {
            const loading = await this.loadingController.create({ message: 'Processando...', spinner: 'crescent' });
            await loading.present();
            
            // Atualizar status de login do usuário no banco
            const query = `
              UPDATE usuarios 
              SET ultimo_login = NULL, 
                  token = NULL
              WHERE id = ?
            `;
            
            this.mysqlService.executeQuery(query, [user.id]).pipe(
              finalize(() => loading.dismiss())
            ).subscribe({
              next: async () => {
                const toast = await this.toastController.create({ 
                  message: `Usuário ${user.name} foi desconectado com sucesso!`, 
                  duration: 3000, 
                  position: 'bottom', 
                  color: 'success' 
                });
                toast.present();
                this.loadLoggedInUsers(); // Recarregar lista de usuários logados
              },
              error: async (err: any) => {
                console.error('Erro ao desconectar usuário:', err);
                const alert = await this.alertController.create({ 
                  header: 'Erro', 
                  message: err.message || 'Erro ao processar a solicitação.', 
                  buttons: ['OK'] 
                });
                alert.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('pt-BR');
  }

  getUserStatusClass(user: User): string {
    if (!user.isActive) return 'user-inactive';
    if (user.role === 'admin') return 'user-admin';
    if (user.role === 'editor') return 'user-editor';
    return 'user-normal';
  }

  translateRole(role?: string): string {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'editor': return 'Editor';
      case 'user': return 'Usuário';
      default: return role || 'Desconhecido';
    }
  }

  async presentAccessDeniedAlert() {
    const alert = await this.alertController.create({
      header: 'Acesso Negado',
      message: 'Apenas administradores podem modificar usuários.',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.router.navigate(['/home']);
        }
      }]
    });

    await alert.present();
  }

  // Novo método para verificar se um usuário está online
  isUserLoggedIn(user: User): boolean {
    return this.loggedInUsers.some(u => u.id === user.id);
  }

  // Método para salvar um usuário (usado pelos botões de salvar)
  async saveUser(user: User) {
    const loading = await this.loadingController.create({ message: 'Salvando usuário...', spinner: 'crescent' });
    await loading.present();

    // Preparar dados para atualização (sem alterar a senha)
    const userData = {
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      // Não incluímos password aqui porque não queremos mudar a senha
    };

    // Usar o serviço de usuário para atualizar
    this.userService.updateUser(user.id!, userData).pipe(
      finalize(() => loading.dismiss())
    ).subscribe({
      next: async () => {
        console.log(`Usuário ${user.name} atualizado com sucesso!`);
        const toast = await this.toastController.create({ 
          message: `Usuário ${user.name} salvo com sucesso!`, 
          duration: 3000, 
          position: 'bottom', 
          color: 'success' 
        });
        toast.present();
        // Recarregar os dados para refletir as alterações
        this.loadUsers();
        this.loadLoggedInUsers();
      },
      error: async (err: any) => {
        console.error('Erro ao salvar usuário:', err);
        const alert = await this.alertController.create({ 
          header: 'Erro', 
          message: err.message || 'Erro ao salvar usuário.', 
          buttons: ['OK'] 
        });
        alert.present();
      }
    });
  }
}