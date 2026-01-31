import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfileDto } from '../utils/dto/user-profile.dto';
import { UserRegisterDto } from '../utils/dto/UserRegisterDto';
import { Page } from '../utils/dto/page.dto';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  baseUrl = "http://localhost:8090/user";
  private http = inject(HttpClient);

  //  BUSCAS E PERFIL

  public getMyProfile(): Observable<UserProfileDto> {
    // Adiciona timestamp para evitar cache no perfil também
    const t = new Date().getTime();
    return this.http.get<UserProfileDto>(`${this.baseUrl}/me?_t=${t}`);
  }

  public getUserProfile(id: number): Observable<UserProfileDto> {
    const t = new Date().getTime();
    return this.http.get<UserProfileDto>(`${this.baseUrl}/${id}?_t=${t}`);
  }

  public getAllUsers(): Observable<UserProfileDto[]> {
    const t = new Date().getTime();
    return this.http.get<UserProfileDto[]>(`${this.baseUrl}/all?_t=${t}`);
  }

  //  BUSCA PAGINADA (USADA NA LISTA)
  public searchUsers(
    page: number,
    size: number,
    sortField: string,
    sortDir: string,
    term: string = '',
    role: string = '',
    hideInactive: boolean = false
  ): Observable<Page<UserProfileDto>> {

    // Cache Buster: Gera um número único (timestamp atual)
    const timestamp = new Date().getTime().toString();

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortField', sortField)
      .set('sortDir', sortDir)
      .set('hideInactive', hideInactive.toString())
      .set('_t', timestamp); // < O SEGREDO ESTÁ AQUI

    if (term) params = params.set('term', term);
    if (role) params = params.set('role', role);

    return this.http.get<Page<UserProfileDto>>(`${this.baseUrl}/search`, { params });
  }

  //  MÉTODOS DE ESCRITA

  public saveUser(user: any): Observable<any> {
    const id = user.id;

    if (!id) {
      return this.http.post(
        `${this.baseUrl}/register`,
        user,
        { responseType: 'text' as 'json' }
      );
    } else {
      return this.http.put(
        `${this.baseUrl}/edit`,
        user,
        { responseType: 'text' as 'json' }
      );
    }
  }

  public deleteUser(id: number): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/delete/${id}`,
      { responseType: 'text' as 'json' }
    );
  }

  // Legados
  public findAll(): Observable<UserRegisterDto[]> {
    return this.http.get<UserRegisterDto[]>(`${this.baseUrl}/list`);
  }
  public findById(id: number): Observable<UserRegisterDto> {
    return this.http.get<UserRegisterDto>(`${this.baseUrl}/find-by-id/${id}`);
  }
  public findByEmail(login: string): Observable<UserRegisterDto> {
    return this.http.get<UserRegisterDto>(`${this.baseUrl}/find-by-login/${login}`);
  }
}
