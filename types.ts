export interface EmployeeData {
  empregador: string;
  numero_ordem: string;
  nome: string;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_uf: string;
  endereco_cep: string;
  filiacao_pai: string;
  filiacao_mae: string;
  data_nascimento: string;
  nacionalidade: string;
  estado_civil: string;
  local_nascimento: string;
  local_nascimento_uf: string;
  ctps: string;
  reservista: string;
  categoria: string;
  cpf: string;
  rg: string;
  titulo_eleitor: string;
  pis: string;
  data_admissao: string;
  cargo: string;
  salario: string;
  cbo: string;
  matricula_esocial: string;
  email: string;
  telefone: string;
}

export interface ProcessedFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  data?: EmployeeData;
  errorMessage?: string;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
}