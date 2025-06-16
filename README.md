# Sistema de Logística - Dashboard

Um sistema dashboard completo para gestão de logística desenvolvido em React com TypeScript, utilizando as cores vermelho sangue e branco conforme solicitado.

## 🚀 Funcionalidades

### Sidebar de Navegação
- **Dashboard** - Visão geral das operações com widgets informativos
- **Cadastro de Caminhões** - Gestão completa da frota de veículos
- **Cadastro de Motoristas** - Controle de motoristas próprios e terceiros
- **Controle de Frete** - Gestão de entregas e rotas
- **Controle de Abastecimento** - Controle de combustível e custos
- **Fechamento Motoristas Terceiros** - Cálculos financeiros e relatórios

## 🎨 Design

- **Cores predominantes**: Vermelho sangue (#8B0000) e branco (#FFFFFF)
- **Interface moderna e responsiva**
- **Sidebar fixa com navegação intuitiva**
- **Componentes reutilizáveis e bem estruturados**
- **Design system consistente**

## 🛠️ Tecnologias Utilizadas

- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática para maior segurança
- **React Router DOM** - Navegação entre páginas
- **Lucide React** - Ícones modernos e consistentes
- **CSS3** - Estilização avançada com variáveis CSS

## 📱 Responsividade

- Design adaptativo para desktop, tablet e mobile
- Sidebar colapsível em telas menores
- Tabelas com scroll horizontal quando necessário
- Cards e grids que se adaptam ao tamanho da tela

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── Layout/
│   │   ├── Layout.tsx
│   │   └── Layout.css
│   └── Sidebar/
│       ├── Sidebar.tsx
│       └── Sidebar.css
├── pages/
│   ├── Dashboard/
│   ├── CadastroCaminhoes/
│   ├── CadastroMotoristas/
│   ├── ControleFrete/
│   ├── ControleAbastecimento/
│   └── FechamentoMotoristas/
├── styles/
│   └── global.css
├── App.tsx
├── App.css
├── index.tsx
└── index.css
```

## 🚦 Como Executar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm start
   ```

3. **Acessar o sistema:**
   - Abra o navegador em `http://localhost:3000`

## 📊 Funcionalidades por Página

### Dashboard
- Widgets com estatísticas gerais
- Visão consolidada das operações
- Cards informativos com ícones

### Cadastro de Caminhões
- Formulário completo para novos veículos
- Lista de caminhões cadastrados
- Filtros e ações de editar/excluir

### Cadastro de Motoristas
- Gestão de motoristas próprios e terceiros
- Campos para CPF, CNH, telefone
- Status ativo/inativo

### Controle de Frete
- Cards visuais para cada frete
- Informações de origem/destino
- Status de entrega em tempo real

### Controle de Abastecimento
- Estatísticas de consumo
- Histórico de abastecimentos
- Cálculo de médias de preço

### Fechamento Motoristas Terceiros
- Cálculos automáticos de pagamentos
- Relatórios por período
- Status de pagamento

## 🎯 Características Técnicas

- **TypeScript** para type safety
- **Hooks React** para gerenciamento de estado
- **CSS Grid e Flexbox** para layouts responsivos
- **Variáveis CSS** para consistência visual
- **Componentes funcionais** modernos
- **Interfaces TypeScript** bem definidas

## 🔧 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm build` - Gera build de produção
- `npm test` - Executa os testes
- `npm eject` - Ejeta a configuração (não recomendado)

## 📈 Próximos Passos

1. Integração com API backend
2. Autenticação e autorização
3. Relatórios em PDF
4. Gráficos dinâmicos
5. Notificações em tempo real
6. Backup e sincronização

## 🎨 Paleta de Cores

- **Vermelho Sangue**: `#8B0000`
- **Vermelho Hover**: `#A00000`
- **Branco**: `#FFFFFF`
- **Cinza Claro**: `#F8F9FA`
- **Cinza Escuro**: `#2C3E50`
- **Borda**: `#E9ECEF`

---

**Desenvolvido com ❤️ em React + TypeScript** 