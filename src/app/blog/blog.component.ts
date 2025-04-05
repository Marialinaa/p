import { Component, OnInit, AfterViewInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatabaseService, BlogPost } from '../services/database.service';
import { addIcons } from 'ionicons';
import { arrowBackOutline, homeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None, // Removendo o encapsulamento CSS
  imports: [IonicModule, CommonModule, ReactiveFormsModule, RouterLink]
})
export class BlogComponent implements OnInit, AfterViewInit {
  // Garantir que variáveis sejam inicializadas corretamente
  blogForm: FormGroup;
  posts: BlogPost[] = [];
  isLoading = false; // Simplificar a declaração
  isSubmitting = false;
  isAuthenticated = false;
  editMode = false;
  currentPostId?: number;
  currentPage = 1;
  totalPages = 2;

  constructor(
    private formBuilder: FormBuilder,
    private dbService: DatabaseService,
    private alertController: AlertController,
    private renderer: Renderer2
  ) {
    // Inicializar o formulário
    this.blogForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      content: ['', [Validators.required, Validators.minLength(10)]]
    });
    
    // Adicionar Font Awesome para os ícones
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(fontAwesome);
    
    // Adicionar ícones do Ionic que serão utilizados
    addIcons({
      arrowBackOutline,
      homeOutline
    });
  }

  ngOnInit() {
    this.loadPosts();
    this.isAuthenticated = this.dbService.isAuthenticated();
  }

  ngAfterViewInit() {
    // Configurar smooth scroll para links de navegação
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = (anchor as HTMLAnchorElement).getAttribute('href');
        if (href && href !== '#') {
          e.preventDefault();
          const targetElement = document.querySelector(href);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
    
    // Configurar o botão de "Ver Mais Notícias"
    const loadMoreBtn = document.getElementById('load-more');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', (event) => {
        this.loadMoreNews(event);
      });
    }
  }

  get title() { return this.blogForm.get('title'); }
  get content() { return this.blogForm.get('content'); }

  loadPosts() {
    this.isLoading = true; // Definir como true antes da chamada assíncrona
    
    this.dbService.getPosts().subscribe({
      next: (posts) => {
        this.posts = posts.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        this.isLoading = false; // Definir como false quando os dados são recebidos
      },
      error: (error) => {
        console.error('Erro ao carregar posts:', error);
        this.isLoading = false; // Importante: definir como false mesmo em caso de erro
        this.posts = []; // Inicializa posts como array vazio em caso de erro
      }
    });
  }

  onSubmit() {
    if (this.blogForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const postData = {
      title: this.title?.value,
      content: this.content?.value,
      author: ''  // O serviço preencherá isso com o nome do usuário atual
    };

    if (this.editMode && this.currentPostId) {
      const updatedPost: BlogPost = {
        ...postData,
        id: this.currentPostId
      };
      this.dbService.updatePost(updatedPost).subscribe({
        next: () => {
          this.resetForm();
          this.loadPosts();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Erro ao atualizar post:', error);
          this.isSubmitting = false;
        }
      });
    } else {
      this.dbService.createPost(postData).subscribe({
        next: () => {
          this.resetForm();
          this.loadPosts();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Erro ao criar post:', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  resetForm() {
    this.blogForm.reset();
    this.editMode = false;
    this.currentPostId = undefined;
  }

  editPost(post: BlogPost) {
    this.editMode = true;
    this.currentPostId = post.id;
    this.blogForm.setValue({
      title: post.title,
      content: post.content
    });
  }

  async deletePost(post: BlogPost) {
    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o post "${post.title}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          role: 'confirm',
          handler: () => {
            if (post.id) {
              this.dbService.deletePost(post.id).subscribe({
                next: () => {
                  this.loadPosts();
                },
                error: (error) => {
                  console.error('Erro ao excluir post:', error);
                }
              });
            }
          }
        }
      ]
    });

    await alert.present();
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Função aprimorada para carregar mais notícias
  loadMoreNews(event: Event) {
    event.preventDefault(); // Prevenir o comportamento padrão do link
    
    const loadMoreBtn = document.getElementById('load-more');
    const hiddenContent = document.querySelectorAll('.hidden-content');
    const loadingAnimation = document.querySelector('.loading');
    const notification = document.getElementById('notification');
    
    if (loadMoreBtn && loadingAnimation && notification) {
      // Mostrar animação de carregamento
      this.renderer.setStyle(loadingAnimation, 'display', 'inline-block');
      
      // Simular delay de carregamento (como se estivesse buscando da API)
      setTimeout(() => {
        // Remover animação de carregamento
        this.renderer.setStyle(loadingAnimation, 'display', 'none');
        
        // Mostrar os itens ocultos
        hiddenContent.forEach(item => {
          this.renderer.removeClass(item, 'hidden-content');
        });
        
        // Incrementar a página atual
        this.currentPage++;
        
        // Se chegou ao final das páginas, ocultar o botão
        if (this.currentPage >= this.totalPages) {
          this.renderer.setStyle(loadMoreBtn, 'display', 'none');
        }
        
        // Mostrar notificação
        this.renderer.addClass(notification, 'show');
        
        // Ocultar notificação após 3 segundos
        setTimeout(() => {
          this.renderer.removeClass(notification, 'show');
        }, 3000);
        
      }, 1500); // Simular um delay de 1.5 segundos
    }
  }
}
