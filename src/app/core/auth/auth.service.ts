import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Ajuste a porta se necessário (8090)
  private apiUrl = 'http://localhost:8090/auth/login';

  constructor(private http: HttpClient) {}

  login(credentials: { login: string; password: string }): Observable<any> {
    // AJUSTE CRÍTICO: 'responseType: text' impede que o Angular quebre ao receber uma string pura
    return this.http.post(this.apiUrl, credentials, { responseType: 'text' as 'json' }).pipe(
      tap((response: any) => {
        let tokenToSave = null;

        try {
          // Tenta ler como JSON (caso o backend retorne { "token": "..." })
          const jsonResponse = typeof response === 'string' ? JSON.parse(response) : response;
          tokenToSave = jsonResponse.token || jsonResponse;
          
          if (jsonResponse.id) {
            localStorage.setItem('user_id', jsonResponse.id.toString());
          }
          if (jsonResponse.role) {
            localStorage.setItem('user_role', jsonResponse.role);
          }
        } catch (e) {
          // Se der erro ao parsear, é porque é uma String pura (o token direto)
          tokenToSave = response;
        }

        if (tokenToSave) {
          localStorage.setItem('TK', tokenToSave);
        } else {
          console.error('Token não encontrado na resposta!', response);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('TK');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    // Garante que não é null, nem "undefined", nem vazio
    return token !== null && token !== 'undefined' && token !== '';
  }

  getToken(): string | null {
    return localStorage.getItem('TK');
  }

  getUserId(): number | null {
    const id = localStorage.getItem('user_id');
    return id ? parseInt(id, 10) : null;
  }

  getUserRole(): string | null {
    return localStorage.getItem('user_role');
  }
}
