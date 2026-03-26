export interface OcorrenciaResponseDto {
  id: number;
  tipo: string;
  ocorrencia: string;
  autorNome: string;
}

export interface MaoDeObraItemDto {
  id?: number;
  maoDeObraId: number;
  maoDeObraNome?: string;
  quantidade: number;
}

export interface ServicoItemDto {
  id?: number;
  servicoId: number;
  servicoNome?: string;
  quantidade: number;
}

export interface EquipamentoItemDto {
  id?: number;
  equipamentoId: number;
  equipamentoNome?: string;
  quantidade: number;
}

export interface CreateOcorrenciaDto {
  tipo: string;
  ocorrencia: string;
}

export interface CreateDiarioDto {
  obraId: number;
  data: string;
  condicaoClimatica: string;
  observacoes?: string;
  maoDeObra: MaoDeObraItemDto[];
  servicos: ServicoItemDto[];
  equipamentos: EquipamentoItemDto[];
  ocorrencias: CreateOcorrenciaDto[];
}

export interface UpdateDiarioDto {
  data: string;
  condicaoClimatica: string;
  observacoes?: string;
  maoDeObra: MaoDeObraItemDto[];
  servicos: ServicoItemDto[];
  equipamentos: EquipamentoItemDto[];
  ocorrencias: CreateOcorrenciaDto[];
}

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
  fotos: string[];
  maoDeObra: MaoDeObraItemDto[];
  servicos: ServicoItemDto[];
  equipamentos: EquipamentoItemDto[];
  ocorrencias: OcorrenciaResponseDto[];
}

export interface DiarioListFilter {
  obra?: string;
  data?: string;
  autor?: string;
}
