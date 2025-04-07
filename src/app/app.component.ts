import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `<ion-app><ion-router-outlet></ion-router-outlet></ion-app>`,
  standalone: true,
  imports: [IonApp, IonRouterOutlet, RouterModule]
})
export class AppComponent {
  constructor(private router: Router) {
    console.log('AppComponent inicializado, navegando para a rota inicial');
    this.router.navigate(['home']).catch(err => console.error('Erro ao navegar:', err));
  }
}
