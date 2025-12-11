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
      return this.http.post<string>(`${this.baseUrl}/register`, user);
    } else {
      return this.http.post<string>(`${this.baseUrl}/edit`, user);
    }
  }
}
