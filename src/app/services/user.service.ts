import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfileDto } from '../utils/dto/user-profile.dto';
import { UserRegisterDto } from '../utils/dto/UserRegisterDto';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  baseUrl = "http://localhost:8090/user";
  private http = inject(HttpClient);

  // Busca o perfil (retorna JSON, então não precisa mudar)
  public getMyProfile(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.baseUrl}/me`);
  }

  public saveUser(user: any): Observable<any> {
    const id = user.id;

    if (!id) {
      // Registro (POST) - Retorna String
      return this.http.post(
        `${this.baseUrl}/register`,
        user,
        { responseType: 'text' as 'json' } // <--- Correção Aqui
      );
    } else {
      // Edição (PUT) - Retorna String
      return this.http.put(
        `${this.baseUrl}/edit`,
        user,
        { responseType: 'text' as 'json' } // <--- Correção Aqui
      );
    }
  }
}
