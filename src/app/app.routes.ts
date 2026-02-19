import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './core/auth/auth.guard';
import { UserComponent } from './pages/user/user.component';
import { DiariosComponent } from './pages/diarios/diarios.component';
import { ObrasComponent } from './pages/obras/obras.component';
import { EditUserComponent } from './pages/edit-user/edit-user.component';
import { ManageUsersComponent } from './pages/manage-users/manage-users.component';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent, data: { title: 'Login' } },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: HomeComponent, data: { title: 'Início' } },
      { path: 'home', component: HomeComponent, data: { title: 'Início' } },
      { path: 'obras', component: ObrasComponent, data: { title: 'Obras' } },
      { path: 'diarios', component: DiariosComponent, data: { title: 'Diários de Obra' } },

      //  Rotas de Admin (Gerenciar Usuários)
      { path: 'manage-users', component: ManageUsersComponent, data: { title: 'Gerenciar Usuários' } },

      //  Rotas de Usuário
      { path: 'user', component: UserComponent, data: { title: 'Usuário' } },

      // Edição do PRÓPRIO perfil (sem ID na URL)
      { path: 'user/edit', component: EditUserComponent, data: { title: 'Editar Perfil' } },

      // Edição de OUTRO usuário (Admin clicando no lápis)
      { path: 'user/edit/:id', component: EditUserComponent, data: { title: 'Editar Usuário' } },

      // Criação de NOVO usuário (Admin)
      { path: 'user/new', component: EditUserComponent, data: { title: 'Novo Usuário' } },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
