export interface DiarioResponseDto {
  id: number;
  obraId: number;
  projeto: string;
  data: string;
  condicaoClimatica: string;
  observacoes?: string;
  status: 'AGUARDANDO_AVALIACAO' | 'VALIDO' | 'INVALIDO';
  autorId: number;
  nomeAutor: string;
  validadorId?: number;
  nomeValidador?: string;
  comentarioValidacao?: string;
}

export interface DiarioListFilter {
  obra?: number;
  data?: string;
  autor?: number;
}
