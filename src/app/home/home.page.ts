import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterLink, CommonModule]
})
export class HomePage implements OnInit {
  isAuthenticated: boolean = false;
  userName: string = '';

  constructor(
    private router: Router,
    private dbService: DatabaseService
  ) {}

  ngOnInit() {
    this.checkAuthStatus();
  }

  ionViewWillEnter() {
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    this.isAuthenticated = this.dbService.isAuthenticated();
    
    if (this.isAuthenticated) {
      this.dbService.currentUser$.subscribe(user => {
        if (user) {
          this.userName = user.name;
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
