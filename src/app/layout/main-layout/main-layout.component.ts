import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  // Como é um componente standalone, ele precisa importar o que usa.
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <!-- Este é o equivalente ao componente Template da estrutura genérica do react. -->
    <app-header></app-header>
    <main>
      <div>Eu sempre apareço!, estou ao redor do outlet</div>
      <!--
        O <router-outlet> é o equivalente ao <Outlet /> do React Router.
        O conteúdo da rota filha (Home, PaginaExemplo, etc.) será renderizado aqui.
      -->
      <router-outlet></router-outlet>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {}
