import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle, 
  IonGrid, IonRow, IonCol, IonThumbnail, IonList, IonItem, IonLabel, IonText } from '@ionic/angular/standalone';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '../services/database.service';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { 
  logInOutline, 
  logOutOutline,
  homeOutline, 
  personAddOutline, 
  documentTextOutline,
  peopleOutline,
  statsChartOutline,
  newspaperOutline,
  personCircleOutline,
  appsOutline,
  rocketOutline,
  alertCircleOutline,
  calendarOutline,
  timeOutline,
  arrowForwardOutline, 
  informationCircleOutline, 
  serverOutline,
  shieldCheckmarkOutline,
  phonePortraitOutline,
  folderOpenOutline,
  clipboardOutline
} from 'ionicons/icons';

interface Noticia {
  titulo: string;
  data: string;
  resumo: string;
  importante: boolean;
}

interface Estatisticas {
  total: number;
  novos: number;
  recentes: number;
}

interface Servico {
  titulo: string;
  descricao: string;
  icone: string;
  link: string;
}

interface Post {
  id: number;
  titulo: string;
  data: string;
  autor: string;
  resumo: string;
  imagem: string;
}

interface Funcionalidade {
  titulo: string;
  descricao: string;
  icone: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonButton,
    RouterLink,
    CommonModule,
    IonIcon,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonCardSubtitle,
    IonGrid,
    IonRow,
    IonCol,
    IonThumbnail,
    IonList,
    IonItem,
    IonLabel,
    IonText
  ]
})
export class HomePage implements OnInit {
  isAuthenticated: boolean = false;
  isAdmin: boolean = false;
  userName: string = '';
  
  // Dados para notícias
  noticias: Noticia[] = [
    {
      titulo: 'Nova atualização do sistema disponível',
      data: '05/04/2025',
      resumo: 'Foi lançada a versão 1.5.0 com novos recursos',
      importante: true
    },
    {
      titulo: 'Manutenção programada',
      data: '10/04/2025',
      resumo: 'Sistema ficará indisponível das 22h às 23h',
      importante: true
    },
    {
      titulo: 'Novo módulo de relatórios',
      data: '01/04/2025',
      resumo: 'Acesse relatórios avançados sobre usuários e atividades',
      importante: false
    }
  ];
  
  // Estatísticas do sistema
  userStats: Estatisticas = {
    total: 156,
    novos: 12,
    recentes: 24
  };
  
  blogStats: Estatisticas = {
    total: 48,
    novos: 5,
    recentes: 8
  };
  
  // Serviços públicos disponíveis
  servicosPublicos: Servico[] = [
    {
      titulo: 'Consulta de Projetos',
      descricao: 'Acesse informações sobre projetos em andamento',
      icone: 'folder-open-outline',
      link: '/projetos'
    },
    {
      titulo: 'Documentação',
      descricao: 'Manuais e tutoriais sobre o sistema',
      icone: 'document-text-outline',
      link: '/docs'
    },
    {
      titulo: 'Agenda de Eventos',
      descricao: 'Calendário de eventos e prazos importantes',
      icone: 'calendar-outline',
      link: '/eventos'
    },
    {
      titulo: 'Formulários',
      descricao: 'Acesse formulários públicos disponíveis',
      icone: 'clipboard-outline',
      link: '/formularios'
    }
  ];
  
  // Posts do blog com imagens base64 em vez de URLs externas
  blogPosts: Post[] = [
    {
      id: 1,
      titulo: 'Implementando CRUD com Angular 17',
      data: '03/04/2025',
      autor: 'Maria Silva',
      resumo: 'Como implementar operações CRUD em Angular 17 usando componentes standalone',
      imagem: this.getPlaceholderImage('Angular CRUD', '#3880ff')
    },
    {
      id: 2,
      titulo: 'Autenticação segura em aplicações Ionic',
      data: '28/03/2025',
      autor: 'João Pereira',
      resumo: 'Boas práticas para implementar autenticação em aplicativos Ionic',
      imagem: this.getPlaceholderImage('Ionic Auth', '#3dc2ff')
    },
    {
      id: 3,
      titulo: 'Otimizando o desempenho de aplicações Angular',
      data: '20/03/2025',
      autor: 'Ana Costa',
      resumo: 'Dicas e técnicas para melhorar a performance de suas aplicações',
      imagem: this.getPlaceholderImage('Angular Performance', '#5260ff')
    }
  ];
  
  // Funcionalidades do sistema
  features: Funcionalidade[] = [
    {
      titulo: 'Sistema de Autenticação',
      descricao: 'Login seguro com validação de campos e CAPTCHA de segurança',
      icone: 'shield-checkmark-outline'
    },
    {
      titulo: 'Gerenciamento de Usuários',
      descricao: 'CRUD completo para administração de usuários do sistema',
      icone: 'people-outline'
    },
    {
      titulo: 'Blog Integrado',
      descricao: 'Plataforma completa para publicação e gerenciamento de conteúdo',
      icone: 'newspaper-outline'
    },
    {
      titulo: 'Interface Responsiva',
      descricao: 'Design adaptável para desktop e dispositivos móveis',
      icone: 'phone-portrait-outline'
    }
  ];

  constructor(
    private router: Router,
    private dbService: DatabaseService,
    private authService: AuthService
  ) {
    // Registrar os ícones que serão usados neste componente
    addIcons({logOutOutline,personCircleOutline,documentTextOutline,peopleOutline,serverOutline,newspaperOutline,alertCircleOutline,informationCircleOutline,statsChartOutline,calendarOutline,timeOutline,logInOutline,personAddOutline,appsOutline,arrowForwardOutline,rocketOutline,homeOutline,shieldCheckmarkOutline,phonePortraitOutline,folderOpenOutline,clipboardOutline});
  }

  /**
   * Gera uma imagem de placeholder SVG com texto e cor personalizados
   * Esta função substitui a dependência de serviços externos como via.placeholder.com
   */
  getPlaceholderImage(text: string, bgColor: string = '#cccccc', textColor: string = '#ffffff'): string {
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
        <rect width="150" height="150" fill="${bgColor}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
              fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  }

  ngOnInit() {
    this.checkAuthStatus();
  }

  ionViewWillEnter() {
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    try {
      this.isAuthenticated = this.authService.isAuthenticated();
      
      if (this.isAuthenticated) {
        // Obter informações do usuário logado
        this.authService.currentUser$.subscribe(user => {
          if (user) {
            this.userName = user.name;
          } else {
            // Tentar obter do localStorage
            const storedUser = localStorage.getItem('current_user');
            if (storedUser) {
              try {
                const userData = JSON.parse(storedUser);
                this.userName = userData.name;
              } catch (error) {
                console.error('Erro ao ler dados do usuário:', error);
              }
            }
          }
        });

        // Verificar se o usuário é administrador
        this.authService.isAdmin().subscribe(isAdmin => {
          this.isAdmin = isAdmin;
        });
      }
    } catch (error) {
      console.error('Erro ao verificar status de autenticação:', error);
      this.isAuthenticated = false;
      this.userName = '';
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  logout() {
    this.dbService.logout();
    this.isAuthenticated = false;
    this.userName = '';
    this.router.navigate(['/home']);
  }
}
