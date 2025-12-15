import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // Cidade
  uf: string;         // Estado
  erro?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CepService {
  private http = inject(HttpClient);

  buscarCep(cep: string): Observable<ViaCepResponse | null> {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return of(null);
    }

    return this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cleanCep}/json/`)
      .pipe(
        catchError(() => of(null)) // Retorna null em caso de erro
      );
  }
}
