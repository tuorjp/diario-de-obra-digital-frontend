import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  template: `
    <div>
      <h2>Sou a tela de login!</h2>
      <button (click)="onLogin()">Fazer Login</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  onLogin() {
    // Em um app real, aqui você chamaria sua API.
    // Para o exemplo, apenas chamamos o serviço para salvar o token.
    this.authService.login();
    
    // Após o login, navega para a página home.
    this.router.navigate(['/home']);
  }
}
