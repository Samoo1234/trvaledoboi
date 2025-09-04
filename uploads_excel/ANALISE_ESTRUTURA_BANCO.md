# 🗄️ ANÁLISE COMPLETA - Estrutura da Base de Dados
**Sistema:** trvaledoboi - Vale do Boi Transportadora  
**Data:** Dezembro 2024  
**Status:** Análise completa | Base para implementação  
**Arquivo analisado:** TEMPLATE CLIENTES.csv (1.235 linhas)

---

## 📊 **ESTRUTURA ATUAL DO SISTEMA**

### **✅ TABELAS EXISTENTES:**
1. **`fretes`** - 396 registros ativos + 42 arquivados
2. **`fretes_historico`** - Histórico de fretes
3. **`caminhoes`** - Cadastro de caminhões
4. **`motoristas`** - Cadastro de motoristas
5. **`reboques`** - Cadastro de reboques
6. **`fornecedores`** - Cadastro de fornecedores
7. **`usuarios`** - Sistema de usuários
8. **`manutencao_caminhoes`** - Controle de manutenção

---

## 🔍 **ANÁLISE DO ARQUIVO CSV - TEMPLATE CLIENTES**

### **📋 ESTRUTURA DAS COLUNAS:**
```
1.  codigo                    - Código interno (opcional)
2.  razao                     - Razão Social/Nome (OBRIGATÓRIO)
3.  fantasia                  - Nome fantasia/apelido (opcional)
4.  cpf_cnpj                  - CPF ou CNPJ (opcional)
5.  tipo                      - C=Cliente, F=Fornecedor, A=Ambos
6.  rg_ie                     - RG ou Inscrição Estadual
7.  im                        - Inscrição Municipal
8.  logradouro                - Rua/Endereço (OBRIGATÓRIO)
9.  numero                    - Número (OBRIGATÓRIO)
10. complemento               - Complemento (opcional)
11. cep                       - CEP (OBRIGATÓRIO)
12. bairro                    - Bairro (OBRIGATÓRIO)
13. ibge                      - Código IBGE (OBRIGATÓRIO)
14. municipio                 - Cidade (OBRIGATÓRIO)
15. uf                        - Estado (OBRIGATÓRIO)
16. cadastro                  - Data de cadastro (OBRIGATÓRIO)
17. aniversario               - Data de nascimento
18. email                     - Email (opcional)
19. fone_resid                - Telefone residencial
20. fone_comercial            - Telefone comercial
21. celular                   - Celular
22. limite                    - Limite de crédito
23. val_receber               - Valor a receber
24. dt_vencimento             - Data de vencimento
25. id_classificacao_tributaria - Classificação tributária
```

---

## 🎯 **DADOS REAIS IDENTIFICADOS**

### **📈 ESTATÍSTICAS DOS CLIENTES:**
- **Total de registros:** 1.235 linhas
- **Tipos predominantes:** 
  - **A (Ambos):** ~90% - Clientes que também são fornecedores
  - **C (Cliente):** ~8% - Apenas clientes
  - **F (Fornecedor):** ~2% - Apenas fornecedores

### **🏢 PERFIL DOS CLIENTES:**
- **Pessoas Físicas:** CPFs individuais (fazendeiros, pecuaristas)
- **Pessoas Jurídicas:** CNPJs de empresas, frigoríficos, supermercados
- **Localização:** Concentrados em MT (Mato Grosso), principalmente região de Barra do Garças

### **📍 LOCALIZAÇÕES PRINCIPAIS:**
- **Barra do Garças-MT:** Cidade base (maior concentração)
- **Agua Boa-MT:** Segunda maior concentração
- **Outras cidades:** Araguaiana, Cocalinho, Poxoréu, Nova Xavantina

---

## 🚀 **IMPLEMENTAÇÃO PROPOSTA - ESTRUTURA HÍBRIDA**

### **🏗️ NOVA ESTRUTURA DE BANCO:**

#### **1. TABELA `clientes` (Pessoa/CNPJ único):**
```sql
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    codigo_original VARCHAR(20),           -- Código do sistema antigo
    razao_social VARCHAR(255) NOT NULL,    -- Nome/Razão Social
    nome_fantasia VARCHAR(255),            -- Apelido/Fantasia
    tipo_pessoa VARCHAR(20) NOT NULL CHECK (tipo_pessoa IN ('Física', 'Jurídica')),
    cpf_cnpj VARCHAR(18) UNIQUE NOT NULL, -- CPF ou CNPJ único
    rg_ie VARCHAR(20),                     -- RG ou Inscrição Estadual
    inscricao_municipal VARCHAR(20),       -- Inscrição Municipal
    telefone_residencial VARCHAR(20),      -- Telefone residencial
    telefone_comercial VARCHAR(20),        -- Telefone comercial
    celular VARCHAR(20),                   -- Celular
    email VARCHAR(255),                    -- Email
    limite_credito DECIMAL(10,2) DEFAULT 0, -- Limite de crédito
    valor_receber DECIMAL(10,2) DEFAULT 0,  -- Valor a receber
    data_vencimento DATE,                  -- Data de vencimento
    classificacao_tributaria INTEGER,      -- Código da classificação
    data_cadastro DATE NOT NULL,           -- Data de cadastro
    data_nascimento DATE,                  -- Data de nascimento
    situacao VARCHAR(20) DEFAULT 'Ativo',  -- Ativo/Inativo
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **2. TABELA `enderecos_clientes` (Múltiplos endereços):**
```sql
CREATE TABLE enderecos_clientes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    tipo_endereco VARCHAR(20) DEFAULT 'Principal', -- Principal, Fazenda, Filial
    logradouro VARCHAR(255) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento TEXT,
    cep VARCHAR(10) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    codigo_ibge VARCHAR(10) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL,
    coordenadas_lat DECIMAL(10,8),        -- Latitude para cálculo de distância
    coordenadas_lng DECIMAL(11,8),        -- Longitude para cálculo de distância
    distancia_barra_garças DECIMAL(8,2),  -- Distância em KM até Barra do Garças
    is_principal BOOLEAN DEFAULT false,   -- Endereço principal do cliente
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **3. TABELA `fazendas_clientes` (Específica para fazendas):**
```sql
CREATE TABLE fazendas_clientes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id),
    endereco_id INTEGER REFERENCES enderecos_clientes(id),
    nome_fazenda VARCHAR(255) NOT NULL,    -- Nome da fazenda
    tipo_propriedade VARCHAR(50),          -- Fazenda, Sítio, Chácara
    area_hectares DECIMAL(10,2),           -- Área em hectares
    atividade_principal VARCHAR(100),      -- Pecuária, Agricultura, Mista
    observacoes TEXT,                      -- Observações específicas
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 **ESTRATÉGIA DE MIGRAÇÃO INTELIGENTE**

### **📥 FASE 1: Importação dos Dados Existentes**
```sql
-- 1. Importar clientes únicos por CPF/CNPJ
-- 2. Identificar e consolidar duplicatas
-- 3. Mapear endereços existentes
-- 4. Preservar códigos originais para referência
```

### **🔗 FASE 2: Integração com Sistema Atual**
```sql
-- 1. Manter campo 'cliente' na tabela fretes
-- 2. Adicionar campo 'cliente_id' (FK para clientes)
-- 3. Implementar busca inteligente (cliente_id OU texto livre)
-- 4. Migração gradual dos dados existentes
```

### **🚀 FASE 3: Funcionalidades Avançadas**
```sql
-- 1. Cálculo automático de distâncias
-- 2. Relatórios por região/cliente
-- 3. Controle de crédito
-- 4. Histórico de fretes por cliente
```

---

## 💡 **FUNCIONALIDADES ESPECÍFICAS**

### **🎯 CADASTRO DE CLIENTES:**
- **Formulário único** para pessoa física/jurídica
- **Validação automática** de CPF/CNPJ
- **Busca por CPF/CNPJ** para evitar duplicatas
- **Importação em lote** do CSV existente

### **🏡 CADASTRO DE FAZENDAS:**
- **Vincular múltiplas fazendas** ao mesmo cliente
- **Endereços detalhados** com coordenadas
- **Cálculo automático** de distância até Barra do Garças
- **Geolocalização** via API de mapas

### **🔍 INTEGRAÇÃO COM FRETES:**
- **Campo cliente atualizado** com busca inteligente
- **Seleção de fazenda** específica para origem/destino
- **Cálculo automático** de quilometragem
- **Histórico completo** por cliente

---

## 🛠️ **ARQUIVOS A SEREM CRIADOS**

### **📁 BACKEND (Banco de Dados):**
- `migrations/001_create_clientes_table.sql`
- `migrations/002_create_enderecos_clientes_table.sql`
- `migrations/003_create_fazendas_clientes_table.sql`
- `migrations/004_add_cliente_id_to_fretes.sql`

### **📁 FRONTEND (React/TypeScript):**
- `src/pages/CadastroClientes/CadastroClientes.tsx`
- `src/pages/CadastroClientes/CadastroClientes.css`
- `src/components/ClienteSelector/ClienteSelector.tsx`
- `src/services/clienteService.ts`
- `src/services/fazendaService.ts`

### **📁 SERVIÇOS:**
- `src/services/geolocalizacaoService.ts` - Cálculo de distâncias
- `src/services/importacaoService.ts` - Importação do CSV

---

## 🎯 **PRÓXIMOS PASSOS**

### **1. VALIDAÇÃO TÉCNICA:**
- [ ] Confirmar estrutura das tabelas propostas
- [ ] Validar campos obrigatórios vs opcionais
- [ ] Definir regras de negócio específicas

### **2. PLANEJAMENTO DE IMPLEMENTAÇÃO:**
- [ ] Cronograma de desenvolvimento
- [ ] Estratégia de migração de dados
- [ ] Plano de testes e validação

### **3. DESENVOLVIMENTO:**
- [ ] Criação das tabelas no banco
- [ ] Desenvolvimento das interfaces
- [ ] Integração com sistema existente
- [ ] Testes e validação

---

## 📊 **BENEFÍCIOS ESPERADOS**

### **✅ PARA USUÁRIOS:**
- **Cadastro padronizado** de clientes
- **Busca rápida** por CPF/CNPJ
- **Histórico completo** de fretes por cliente
- **Controle de crédito** e valores a receber

### **✅ PARA O NEGÓCIO:**
- **Eliminação de duplicatas** de clientes
- **Relatórios precisos** por região/cliente
- **Controle financeiro** melhorado
- **Base de dados** consolidada e confiável

---

*Documento criado em: Dezembro 2024*  
*Sistema: Vale do Boi - Transportadora*  
*Status: Análise completa | Aguardando validação e implementação*

