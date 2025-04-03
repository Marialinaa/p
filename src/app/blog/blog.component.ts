import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DatabaseService, BlogPost } from '../services/database.service';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class BlogComponent implements OnInit {
  blogForm: FormGroup;
  posts: BlogPost[] = [];
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  isAuthenticated: boolean = false;
  editMode: boolean = false;
  currentPostId?: number;

  constructor(
    private formBuilder: FormBuilder,
    private dbService: DatabaseService,
    private alertController: AlertController
  ) {
    this.blogForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      content: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.loadPosts();
    this.isAuthenticated = this.dbService.isAuthenticated();
  }

  get title() { return this.blogForm.get('title'); }
  get content() { return this.blogForm.get('content'); }

  loadPosts() {
    this.isLoading = true;
    this.dbService.getPosts().subscribe({
      next: (posts) => {
        this.posts = posts.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Ordem decrescente (mais recentes primeiro)
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar posts:', error);
        this.isLoading = false;
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
}
