import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { PaginaExemploComponent } from './pages/pagina-exemplo/pagina-exemplo.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './core/auth/auth.guard';

// Este arquivo é o equivalente ao RouterDecider e Routes juntos.
// A lógica de qual rota mostrar é controlada pelo `authGuard`.
export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    // Rota "pai" que usa o componente de Layout (Template)
    path: '',
    component: MainLayoutComponent,
    // O 'canActivate' funciona como o RouterDecider.
    // O `authGuard` será executado antes de carregar esta rota e suas filhas.
    // Se o guarda retornar `false`, ele redirecionará para /login.
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        component: HomeComponent,
      },
      {
        path: 'exemplo',
        component: PaginaExemploComponent,
      },
      // Redireciona a rota raiz ('/') para '/home'
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  // Rota curinga (catch-all), equivalente ao `path="*"`.
  // Se o usuário não estiver logado, o authGuard o levará para /login.
  // Se estiver logado, qualquer rota não encontrada o levará para /home.
  {
    path: '**',
    redirectTo: 'home',
  },
];
