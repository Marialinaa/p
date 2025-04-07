import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    // O AppComponent é standalone e não deve estar nas declarations
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppComponent // Importar o componente standalone ao invés de declará-lo
  ],
  providers: [],
  bootstrap: [
    // O AppComponent standalone não pode ser usado no bootstrap
  ]
})
export class AppModule { }