import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // Singleton: uma única instância para toda a aplicação.
})
export class AuthService {
  // Para este exemplo, usaremos o localStorage para simular a presença do token.
  // Em uma aplicação real, você provavelmente usaria cookies seguros (HttpOnly).
  
  // Simula o login salvando um token falso.
  login() {
    localStorage.setItem('TK', 'meu-token-super-secreto');
  }

  // Simula o logout.
  logout() {
    localStorage.removeItem('TK');
  }

  // Verifica se o usuário está logado.
  isLoggedIn(): boolean {
    // O '!!' converte o resultado (string ou null) para um booleano (true ou false).
    return !!this.getToken();
  }

  // Pega o token para ser usado pelo interceptor.
  getToken(): string | null {
    return localStorage.getItem('TK');
  }
}
