# PRD - Sistema de Logística e Gestão de Transportes

## 1. Visão Geral do Produto

### 1.1 Propósito
O Sistema de Logística é uma aplicação web desenvolvida em React/TypeScript para gestão completa de operações logísticas, incluindo controle de frota, motoristas, fretes, abastecimento e fechamentos financeiros.

### 1.2 Objetivos de Negócio
- Centralizar a gestão de operações logísticas em uma única plataforma
- Automatizar cálculos de comissões e fechamentos financeiros
- Melhorar o controle de custos operacionais (combustível, manutenção)
- Facilitar o acompanhamento de fretes e entregas
- Gerar relatórios e análises para tomada de decisão

### 1.3 Público-Alvo
- Empresas de transporte e logística
- Gestores de frota
- Operadores logísticos
- Administradores financeiros

## 2. Funcionalidades Principais

### 2.1 Autenticação e Autorização
- **Login de usuários** com email e senha
- **Controle de acesso** baseado em perfis (Admin/Operador)
- **Sessão persistente** com validação automática
- **Proteção de rotas** para áreas sensíveis

### 2.2 Dashboard Principal
- **Visão geral** das operações em tempo real
- **Estatísticas consolidadas**:
  - Total de caminhões ativos
  - Motoristas ativos
  - Fretes em andamento
  - Abastecimentos do dia
- **Atividades recentes** com histórico de ações
- **Widgets informativos** com métricas-chave

### 2.3 Gestão de Frota

#### 2.3.1 Cadastro de Caminhões
- **Dados do veículo**: placa, modelo, tipo, ano, cor
- **Especificações técnicas**: combustível, status
- **Controle de status**: Ativo/Inativo
- **Operações**: Criar, editar, excluir, visualizar

#### 2.3.2 Cadastro de Reboques
- **Dados do reboque**: placa, modelo, tipo, ano
- **Especificações**: capacidade, status
- **Vinculação** com caminhões

### 2.4 Gestão de Pessoal

#### 2.4.1 Cadastro de Motoristas
- **Dados pessoais**: nome, CPF, RG, data de nascimento
- **Documentação**: CNH, categoria, vencimento
- **Contato**: telefone, email, endereço completo
- **Classificação**: Próprio/Terceiro
- **Comissões**: percentual personalizado
- **Status**: Ativo/Inativo

#### 2.4.2 Gerenciamento de Usuários (Admin)
- **Cadastro de usuários** do sistema
- **Definição de perfis** (Admin/Operador)
- **Controle de acesso** e permissões

### 2.5 Gestão de Clientes e Fornecedores

#### 2.5.1 Cadastro de Clientes
- **Dados completos**: razão social, nome fantasia, CPF/CNPJ
- **Classificação**: Pessoa Física/Jurídica
- **Contato**: telefone, celular, email
- **Endereço completo** com CEP
- **Controle financeiro**: limite de crédito, valor a receber
- **Status**: Ativo/Inativo

#### 2.5.2 Cadastro de Fornecedores
- **Dados da empresa**: razão social, CNPJ
- **Contato**: telefone, email, endereço
- **Especialização**: tipo de serviço/produto

### 2.6 Controle de Fretes

#### 2.6.1 Gestão de Fretes
- **Dados do frete**: data de emissão, origem, destino
- **Informações comerciais**: pecuarista, cliente, valor
- **Documentação**: número da minuta, CB
- **Operacional**: faixa, quilometragem total
- **Status**: Pendente/Em Andamento/Concluído/Cancelado
- **Pagamento**: tipo, data de pagamento

#### 2.6.2 Múltiplos Caminhões e Motoristas
- **Associação flexível** de caminhões ao frete
- **Múltiplos motoristas** por frete
- **Valor individual** por caminhão
- **Configuração específica** por veículo

#### 2.6.3 Relatório de Acerto
- **Filtros por período** e cliente
- **Consolidação de fretes** por cliente
- **Cálculos automáticos** de valores
- **Exportação** de relatórios

### 2.7 Controle de Abastecimento

#### 2.7.1 Gestão de Abastecimentos
- **Dados do abastecimento**: data, posto, combustível
- **Quantidade**: litros, preço total
- **Vinculação**: caminhão e motorista
- **Operacional**: KM rodado, número do ticket
- **Controle**: tanque cheio, mês de referência

#### 2.7.2 Relatórios de Consumo
- **Estatísticas por equipamento** e prefixo
- **Análise de consumo** e custos
- **Comparativos** entre períodos
- **Métricas de eficiência**

### 2.8 Fechamento de Motoristas

#### 2.8.1 Cálculos Automáticos
- **Comissões por frete** baseadas em percentual
- **Descontos de abastecimento** por motorista
- **Valores líquidos** a pagar
- **Períodos de fechamento** configuráveis

#### 2.8.2 Gestão de Fechamentos
- **Criação de fechamentos** por período
- **Validação de dados** antes do fechamento
- **Histórico completo** de fechamentos
- **Status de pagamento**

### 2.9 Manutenção de Caminhões

#### 2.9.1 Controle de Manutenções
- **Tipos de manutenção**: preventiva, corretiva, emergencial
- **Dados da manutenção**: data, descrição, valor
- **Fornecedor**: empresa responsável
- **Documentação**: notas fiscais, garantias

#### 2.9.2 Relatórios de Manutenção
- **Por tipo de manutenção**
- **Por caminhão**
- **Consolidado geral**
- **Análise de custos**

### 2.10 Gestão de Vales

#### 2.10.1 Controle de Vales
- **Emissão de vales** para motoristas
- **Valores e finalidades** específicas
- **Controle de utilização**
- **Prestação de contas**

### 2.11 Histórico e Arquivamento

#### 2.11.1 Sistema de Histórico
- **Arquivamento de fretes** concluídos
- **Arquivamento de fechamentos** processados
- **Filtros avançados** para consulta
- **Reabertura** de registros quando necessário

#### 2.11.2 Consultas e Relatórios
- **Filtros por data, motorista, cliente**
- **Busca textual** em todos os campos
- **Exportação** de dados
- **Visualização detalhada**

### 2.12 Capa de Transporte

#### 2.12.1 Geração de Capas
- **Documentos padronizados** para transporte
- **Dados do frete** e veículos
- **Informações do motorista**
- **Rota e destino**

## 3. Requisitos Técnicos

### 3.1 Tecnologias Utilizadas
- **Frontend**: React 18 + TypeScript
- **Roteamento**: React Router DOM
- **Ícones**: Lucide React
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Estilização**: CSS3 com variáveis

### 3.2 Arquitetura
- **SPA (Single Page Application)**
- **Componentes funcionais** com hooks
- **Context API** para gerenciamento de estado
- **Serviços** para comunicação com API
- **TypeScript** para type safety

### 3.3 Responsividade
- **Design adaptativo** para desktop, tablet e mobile
- **Sidebar colapsível** em telas menores
- **Tabelas com scroll horizontal** quando necessário
- **Cards e grids** responsivos

## 4. Requisitos de Interface

### 4.1 Design System
- **Cores principais**: Vermelho sangue (#8B0000) e branco (#FFFFFF)
- **Tipografia**: Sistema de fontes consistente
- **Componentes**: Botões, formulários, tabelas padronizados
- **Ícones**: Lucide React para consistência visual

### 4.2 Navegação
- **Sidebar fixa** com menu principal
- **Breadcrumbs** para orientação
- **Rotas protegidas** com autenticação
- **Feedback visual** para ações do usuário

### 4.3 Formulários
- **Validação em tempo real**
- **Mensagens de erro** claras
- **Campos obrigatórios** identificados
- **Auto-save** quando apropriado

## 5. Requisitos de Performance

### 5.1 Carregamento
- **Tempo de carregamento** inicial < 3 segundos
- **Lazy loading** de componentes pesados
- **Otimização de imagens** e assets
- **Cache** de dados frequentes

### 5.2 Responsividade
- **Tempo de resposta** < 1 segundo para ações comuns
- **Feedback imediato** para ações do usuário
- **Loading states** para operações longas
- **Error handling** robusto

## 6. Requisitos de Segurança

### 6.1 Autenticação
- **Sessões seguras** com tokens
- **Expiração automática** de sessões
- **Logout automático** por inatividade
- **Validação** de credenciais

### 6.2 Autorização
- **Controle de acesso** baseado em perfis
- **Proteção de rotas** sensíveis
- **Validação** de permissões no backend
- **Auditoria** de ações críticas

### 6.3 Dados
- **Validação** de entrada em todos os formulários
- **Sanitização** de dados antes do armazenamento
- **Backup** automático de dados críticos
- **Criptografia** de dados sensíveis

## 7. Requisitos de Usabilidade

### 7.1 Interface
- **Design intuitivo** e familiar
- **Navegação consistente** em todas as telas
- **Feedback visual** para todas as ações
- **Ajuda contextual** quando necessário

### 7.2 Acessibilidade
- **Contraste adequado** de cores
- **Navegação por teclado** funcional
- **Textos alternativos** para imagens
- **Estrutura semântica** adequada

### 7.3 Mobile
- **Interface otimizada** para dispositivos móveis
- **Gestos touch** intuitivos
- **Performance** adequada em conexões lentas
- **Orientação** portrait e landscape

## 8. Critérios de Aceitação

### 8.1 Funcionalidades Core
- [ ] Login e autenticação funcionando corretamente
- [ ] Dashboard exibindo estatísticas em tempo real
- [ ] CRUD completo para todas as entidades principais
- [ ] Cálculos automáticos de comissões e fechamentos
- [ ] Relatórios gerados corretamente
- [ ] Sistema de filtros e busca funcionando

### 8.2 Performance
- [ ] Carregamento inicial < 3 segundos
- [ ] Ações comuns < 1 segundo
- [ ] Interface responsiva em todos os dispositivos
- [ ] Sem vazamentos de memória

### 8.3 Segurança
- [ ] Autenticação segura implementada
- [ ] Controle de acesso funcionando
- [ ] Dados validados e sanitizados
- [ ] Sessões gerenciadas corretamente

### 8.4 Usabilidade
- [ ] Interface intuitiva e fácil de usar
- [ ] Navegação consistente
- [ ] Feedback adequado para o usuário
- [ ] Tratamento de erros implementado

## 9. Roadmap e Próximas Funcionalidades

### 9.1 Fase 1 (Atual)
- ✅ Sistema base de autenticação
- ✅ CRUD de entidades principais
- ✅ Dashboard e relatórios básicos
- ✅ Interface responsiva

### 9.2 Fase 2 (Próximas)
- [ ] Integração com APIs externas
- [ ] Notificações em tempo real
- [ ] Relatórios em PDF
- [ ] Gráficos dinâmicos avançados

### 9.3 Fase 3 (Futuro)
- [ ] App mobile nativo
- [ ] Integração com GPS
- [ ] IA para otimização de rotas
- [ ] Analytics avançados

## 10. Métricas de Sucesso

### 10.1 Operacionais
- **Tempo de processamento** de fretes reduzido em 50%
- **Erros de cálculo** de comissões eliminados
- **Tempo de geração** de relatórios < 30 segundos
- **Disponibilidade** do sistema > 99%

### 10.2 Usuários
- **Satisfação** dos usuários > 4.5/5
- **Tempo de treinamento** < 2 horas
- **Redução de erros** operacionais em 80%
- **Adoção** completa da equipe em 30 dias

---

**Documento criado em**: Dezembro 2024  
**Versão**: 1.0  
**Status**: Ativo  
**Próxima revisão**: Janeiro 2025
