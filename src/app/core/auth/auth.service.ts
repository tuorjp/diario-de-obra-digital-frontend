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
        console.log('Resposta do Login no Backend:', response);

        let tokenToSave = null;

        try {
          // Tenta ler como JSON (caso o backend retorne { "token": "..." })
          const jsonResponse = JSON.parse(response);
          tokenToSave = jsonResponse.token || jsonResponse;
        } catch (e) {
          // Se der erro ao parsear, é porque é uma String pura (o token direto)
          tokenToSave = response;
        }

        if (tokenToSave) {
          localStorage.setItem('TK', tokenToSave);
          console.log('Token salvo com sucesso:', tokenToSave);
        } else {
          console.error('Token não encontrado na resposta!', response);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('TK');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    // Garante que não é null, nem "undefined", nem vazio
    return token !== null && token !== 'undefined' && token !== '';
  }

  getToken(): string | null {
    return localStorage.getItem('TK');
  }
}
