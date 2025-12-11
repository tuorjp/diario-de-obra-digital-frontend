import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {UserRegisterDto} from '../utils/dto/UserRegisterDto';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  baseUrl = "http://localhost:8090/user";
  private http = inject(HttpClient)

  public saveUser(user: UserRegisterDto): Observable<string> {
    const id = user.id;

    if(!id) {
      return this.http.post(`${this.baseUrl}/register`, user, { responseType: 'text' });
    } else {
      return this.http.put<string>(`${this.baseUrl}/edit`, user);
    }
  }

  public findByEmail(login: string): Observable<UserRegisterDto> {
    return this.http.get(`${this.baseUrl}/find-by-login/${login}`)
  }
  
  public findById(id: number): Observable<UserRegisterDto> {
    return this.http.get(`${this.baseUrl}/find-by-id/${id}`)
  }

  public findAll(): Observable<UserRegisterDto[]> {
    return this.http.get<UserRegisterDto[]>(`${this.baseUrl}/list`);
  }
}
