import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { PaginaExemploComponent } from './pages/pagina-exemplo/pagina-exemplo.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  //1. Primeiro, define o redirecionamento padrão
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  //2. Tela de login (não protegida)
  {
    path: 'login',
    component: LoginComponent,
  },

  //3. Layout principal com páginas protegidas
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'exemplo', component: PaginaExemploComponent },
    ],
  },

  //4. Rota curinga
  {
    path: '**',
    redirectTo: 'login',
  },
];
