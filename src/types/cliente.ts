export interface Cliente {
  id?: number;
  codigo_original?: string;
  razao_social: string;
  nome_fantasia?: string;
  tipo_pessoa: 'Física' | 'Jurídica';
  cpf_cnpj: string;
  rg_ie?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  logradouro?: string;
  numero?: string;
  cep?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  limite_credito?: number;
  valor_receber?: number;
  data_cadastro: string;
  data_nascimento?: string;
  situacao: 'Ativo' | 'Inativo';
  created_at?: string;
}
