# 🗄️ Sistema de Arquivamento Automático de Fretes

## 📋 Visão Geral

O sistema agora possui **arquivamento automático** de fretes antigos, executado automaticamente após o **dia 10 de cada mês**.

## 🎯 Como Funciona

### Regras de Arquivamento

1. **Quando**: Após o dia 10 de cada mês (automaticamente)
2. **O que**: Apenas fretes **PAGOS** com `data_emissao` do **mês anterior ou anterior**
3. **Frequência**: Uma vez por mês (evita duplicatas)
4. **Condição**: `situacao = 'Pago'` (fretes pendentes continuam ativos)

### Exemplo Prático

```
Hoje: 15/11/2024
↓
Sistema verifica: Já passamos do dia 10? ✅ Sim
↓
Sistema busca: Fretes PAGOS até 31/10/2024
  ✅ Frete #123 - Pago (R$ 5.000) → ARQUIVADO
  ❌ Frete #124 - Pendente (R$ 3.000) → CONTINUA ATIVO
  ✅ Frete #125 - Pago (R$ 2.500) → ARQUIVADO
↓
Resultado: Apenas fretes PAGOS de outubro e anteriores são arquivados
```

## 🔧 Configuração

### Dia de Execução

Por padrão, o arquivamento ocorre após o **dia 10**. Para alterar:

```typescript
// Em src/services/arquivamentoAutomaticoService.ts
const DIA_ARQUIVAMENTO = 10; // Altere para o dia desejado
```

### Desabilitar Arquivamento Automático

Para desabilitar temporariamente, comente o useEffect no `ControleFrete.tsx`:

```typescript
// Executar arquivamento automático em background
useEffect(() => {
  // ... código comentado
}, []);
```

## 🚀 Como Usar

### Uso Normal (Automático)

1. Abra o sistema após o dia 10 do mês
2. O sistema verifica automaticamente se precisa arquivar
3. Se necessário, arquiva os fretes antigos
4. Mostra notificação com quantidade de fretes arquivados

### Forçar Arquivamento Manual

Para forçar o arquivamento (útil para testes), abra o **Console do Navegador** (F12) e execute:

```javascript
// Importar o serviço
import { arquivamentoAutomaticoService } from './services/arquivamentoAutomaticoService';

// Forçar arquivamento
arquivamentoAutomaticoService.forcarArquivamento()
  .then(quantidade => console.log(`✅ ${quantidade} fretes arquivados`));

// Ou limpar registro e executar novamente
arquivamentoAutomaticoService.limparRegistro();
arquivamentoAutomaticoService.forcarArquivamento()
  .then(quantidade => console.log(`✅ ${quantidade} fretes arquivados`));
```

### Via Console do Navegador (mais simples)

```javascript
// Forçar arquivamento
window.forcarArquivamento = async () => {
  const { arquivamentoAutomaticoService } = await import('./services/arquivamentoAutomaticoService');
  const quantidade = await arquivamentoAutomaticoService.forcarArquivamento();
  alert(`✅ ${quantidade} fretes arquivados!`);
  window.location.reload();
};

// Execute:
forcarArquivamento();
```

## 📊 Verificar Status

Para verificar o último arquivamento:

```javascript
// Console do navegador
localStorage.getItem('ultimo_arquivamento_automatico');
```

Retorna algo como:
```json
{
  "data": "2024-11-15T10:30:00.000Z",
  "periodo": "11/2024",
  "quantidade": 150
}
```

## 🔍 Logs e Monitoramento

O sistema registra logs detalhados no console:

- `🔍 Buscando fretes para arquivar...`
- `📦 Encontrados X fretes para arquivar`
- `📦 Progresso: X/Y fretes arquivados`
- `✅ Arquivamento automático concluído: X fretes arquivados`

## ⚙️ Comportamento Técnico

### Primeira Execução (após dia 10)

1. Sistema verifica se é após dia 10 ✅
2. Busca fretes com `data_emissao <= último dia do mês anterior`
3. Arquiva cada frete individualmente
4. Registra execução no localStorage
5. Mostra notificação ao usuário

### Execuções Subsequentes

1. Sistema verifica se é após dia 10 ✅
2. Verifica se já arquivou neste período ✅
3. **Não executa novamente** (evita duplicatas)

### No próximo mês

1. Novo período detectado (ex: 12/2024)
2. Sistema executa arquivamento novamente
3. Arquiva fretes do mês anterior (11/2024)

## 🛠️ Troubleshooting

### "Arquivamento não está executando"

1. Verifique se já passou do dia 10
2. Verifique o localStorage:
   ```javascript
   localStorage.getItem('ultimo_arquivamento_automatico');
   ```
3. Se necessário, limpe e force:
   ```javascript
   localStorage.removeItem('ultimo_arquivamento_automatico');
   location.reload();
   ```

### "Arquivou fretes que não deveria"

O sistema arquiva **todos os fretes** até o último dia do mês anterior. Se precisar recuperar:

1. Acesse a aba "Fretes Arquivados"
2. Localize o frete
3. Clique em "Reabrir" para voltar à tabela ativa

### "Erro ao arquivar"

Verifique:
- Conexão com banco de dados
- Permissões no Supabase
- Console do navegador para erros detalhados

## 📁 Arquivos Relacionados

- `src/services/arquivamentoAutomaticoService.ts` - Lógica principal
- `src/pages/ControleFrete/ControleFrete.tsx` - Integração
- `src/services/freteService.ts` - Método `arquivar()`

## 🎯 Melhorias Futuras

- [ ] Interface gráfica para configurar dia de arquivamento
- [ ] Notificações por e-mail quando arquivamento ocorre
- [ ] Relatório de fretes arquivados por período
- [ ] Configuração por usuário (cada um arquiva em dias diferentes)
- [ ] Opção de arquivar apenas fretes "Pagos" ou "Fechados"

## 📝 Observações Importantes

1. **Backup**: Fretes arquivados **NÃO SÃO DELETADOS**, apenas movidos para `fretes_historico`
2. **Reversível**: Sempre é possível reabrir um frete arquivado
3. **Performance**: Arquivamento melhora performance do sistema (menos dados na tabela ativa)
4. **Automático**: Não requer intervenção manual após configurado

---

**Data de Implementação**: Outubro 2024  
**Versão**: 1.0.0  
**Status**: ✅ Ativo

