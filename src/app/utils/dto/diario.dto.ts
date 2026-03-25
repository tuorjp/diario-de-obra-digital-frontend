export interface DiarioResponseDto {
  id: number;
  obraId: number;
  projeto: string;
  data: string;
  condicaoClimatica: string;
  observacoes?: string;
  status: 'AGUARDANDO_AVALIACAO' | 'VALIDO' | 'INVALIDO';
  autorId: number;
  autorNome: string;
  validadorId?: number;
  nomeValidador?: string;
  comentarioValidacao?: string;
}

export interface DiarioListFilter {
  obra?: string;
  data?: string;
  autor?: string;
}
