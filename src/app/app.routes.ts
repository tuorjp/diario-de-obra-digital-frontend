import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './core/auth/auth.guard';
import { UserComponent } from './pages/user/user.component';
import {DiariosComponent} from './pages/diarios/diarios.component';
import {ObrasComponent} from './pages/obras/obras.component';
import { EditUserComponent } from './pages/edit-user/edit-user.component';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent, data: { title: 'Login' } },

  // AJUSTE: Todas as rotas protegidas devem estar dentro deste único bloco
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: HomeComponent, data: { title: 'Início' } },
      { path: 'home', component: HomeComponent, data: { title: 'Início' } },
      { path: 'obras', component: ObrasComponent, data: { title: 'Obras' } },
      { path: 'diarios', component: DiariosComponent, data: { title: 'Diários de Obra' } },

      // Rotas de Usuário
      { path: 'user', component: UserComponent, data: { title: 'Usuário' } },
      { path: 'user/edit', component: EditUserComponent, data: { title: 'Editar Perfil' } },
    ],
  },

  // AJUSTE: O Wildcard deve ser SEMPRE a última rota
  { path: '**', redirectTo: 'login' },
];


