import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle, 
  IonGrid, IonRow, IonCol, IonThumbnail, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '../services/database.service';
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
  arrowForwardOutline
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
    IonLabel
  ]
})
export class HomePage implements OnInit {
  isAuthenticated: boolean = false;
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
  
  // Posts do blog
  blogPosts: Post[] = [
    {
      id: 1,
      titulo: 'Implementando CRUD com Angular 17',
      data: '03/04/2025',
      autor: 'Maria Silva',
      resumo: 'Como implementar operações CRUD em Angular 17 usando componentes standalone',
      imagem: 'assets/img/post1.jpg'
    },
    {
      id: 2,
      titulo: 'Autenticação segura em aplicações Ionic',
      data: '28/03/2025',
      autor: 'João Pereira',
      resumo: 'Boas práticas para implementar autenticação em aplicativos Ionic',
      imagem: 'assets/img/post2.jpg'
    },
    {
      id: 3,
      titulo: 'Otimizando o desempenho de aplicações Angular',
      data: '20/03/2025',
      autor: 'Ana Costa',
      resumo: 'Dicas e técnicas para melhorar a performance de suas aplicações',
      imagem: 'assets/img/post3.jpg'
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
    private dbService: DatabaseService
  ) {
    // Registrar os ícones que serão usados neste componente
    addIcons({
      logOutOutline,
      documentTextOutline,
      peopleOutline,
      logInOutline,
      personAddOutline,
      homeOutline,
      statsChartOutline,
      newspaperOutline,
      personCircleOutline,
      appsOutline,
      rocketOutline,
      alertCircleOutline,
      calendarOutline,
      timeOutline,
      arrowForwardOutline
    });
  }

  ngOnInit() {
    this.checkAuthStatus();
  }

  ionViewWillEnter() {
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    this.isAuthenticated = this.dbService.isAuthenticated();
    
    if (this.isAuthenticated) {
      // Obter informações do usuário logado
      this.dbService.currentUser$.subscribe(user => {
        if (user) {
          this.userName = user.name;
        } else {
          // Tentar obter do localStorage
          const storedUser = localStorage.getItem('currentUser');
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
