import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page } from '../utils/dto/page.dto';
import { DiarioResponseDto } from '../utils/dto/diario.dto';

@Injectable({
  providedIn: 'root'
})
export class DiarioDeObraService {
  baseUrl = "http://localhost:8090/diario";
  private http = inject(HttpClient);

  public searchDiarios(
    page: number,
    size: number,
    obra?: string,
    data?: string,
    autor?: string
  ): Observable<Page<DiarioResponseDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (obra) params = params.set('obra', obra);
    if (data) params = params.set('data', data);
    if (autor) params = params.set('autor', autor);

    return this.http.get<Page<DiarioResponseDto>>(this.baseUrl, { params });
  }

  public searchDiariosByObraId(
    obraId: number,
    page: number,
    size: number
  ): Observable<Page<DiarioResponseDto>> {
    const params = new HttpParams()
      .set('obraId', obraId.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<DiarioResponseDto>>(this.baseUrl, { params });
  }

  public deleteDiario(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' as 'json' });
  }

  public aprovarDiario(id: number, comentario?: string): Observable<DiarioResponseDto> {
    const payload = comentario ? { comentario } : {};
    return this.http.patch<DiarioResponseDto>(`${this.baseUrl}/${id}/aprovar`, payload);
  }

  public reprovarDiario(id: number, comentario?: string): Observable<DiarioResponseDto> {
    const payload = comentario ? { comentario } : {};
    return this.http.patch<DiarioResponseDto>(`${this.baseUrl}/${id}/reprovar`, payload);
  }

  public getDiario(id: number): Observable<DiarioResponseDto> {
    return this.http.get<DiarioResponseDto>(`${this.baseUrl}/${id}`);
  }

  public createDiario(obraId: number, diarioBlob: Blob, fotos: File[]): Observable<DiarioResponseDto> {
    const formData = new FormData();
    formData.append('dados', diarioBlob);
    fotos.forEach(foto => formData.append('fotos', foto));
    return this.http.post<DiarioResponseDto>(`${this.baseUrl}/${obraId}`, formData);
  }

  public updateDiario(id: number, diarioBlob: Blob, fotos: File[]): Observable<DiarioResponseDto> {
    const formData = new FormData();
    formData.append('dados', diarioBlob);
    fotos.forEach(foto => formData.append('fotos', foto));
    return this.http.put<DiarioResponseDto>(`${this.baseUrl}/${id}`, formData);
  }

  public getEquipamentos(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8090/catalogo/equipamentos');
  }

  public getMaoDeObra(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8090/catalogo/maodeobras');
  }

  public getServicos(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8090/catalogo/servicos');
  }
}
