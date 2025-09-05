# Análise: Sistema de Múltiplas Viagens

## Problema Identificado

O sistema atual **não aceita múltiplas viagens** do mesmo motorista para um mesmo frete. Quando um motorista faz 2 ou 3 viagens de R$ 750,00 cada, o sistema agrega tudo em uma única entrada.

## Limitações Atuais

### 1. Frontend (ControleFrete.tsx)

**Localização:** `src/pages/ControleFrete/ControleFrete.tsx` - Linhas 286-293

```typescript
// Salvar vínculos de motoristas com caminhão específico
for (const motorista of motoristasSelecionados) {
  await freteMotoristaService.create({ 
    frete_id: freteId!, 
    motorista_id: parseInt(motorista.motorista_id),
    caminhao_id: parseInt(motorista.caminhao_id)
  });
}
```

**Problema:** O sistema salva apenas **1 entrada por motorista**, mesmo que ele faça múltiplas viagens.

### 2. Banco de Dados

**Estrutura atual:**
- `frete_motorista`: 1 entrada por motorista por frete
- `frete_caminhao`: 1 entrada por caminhão por frete

**Exemplo do problema:**
- Wilson faz 2 viagens de R$ 750,00 = R$ 1.500,00 total
- Sistema salva: 1 entrada com R$ 1.500,00
- **Deveria salvar:** 2 entradas de R$ 750,00 cada

### 3. Cálculo (fechamentoService.ts)

**Localização:** `src/services/fechamentoService.ts`

O sistema busca 1 entrada por motorista e soma os valores, mas não consegue representar múltiplas viagens individuais.

## Solução Necessária

### 1. Modificar Frontend

**Arquivo:** `src/pages/ControleFrete/ControleFrete.tsx`

**Mudanças necessárias:**
- Permitir adicionar múltiplas entradas do mesmo motorista
- Interface para especificar quantidade de viagens
- Validação para garantir que cada viagem tenha valor individual

**Exemplo de interface:**
```
Motorista: Wilson
├── Viagem 1: R$ 750,00
├── Viagem 2: R$ 750,00
└── Total: R$ 1.500,00
```

### 2. Modificar Banco de Dados

**Tabelas afetadas:**
- `frete_motorista`: Aceitar múltiplas entradas por motorista
- `frete_caminhao`: Aceitar múltiplas entradas por caminhão

**Estrutura proposta:**
```sql
-- Exemplo para Wilson com 2 viagens
INSERT INTO frete_motorista (frete_id, motorista_id, caminhao_id, viagem_numero) VALUES 
(457, 7, 12, 1),
(457, 7, 12, 2);

INSERT INTO frete_caminhao (frete_id, caminhao_id, valor_frete, viagem_numero) VALUES 
(457, 12, 750.00, 1),
(457, 12, 750.00, 2);
```

### 3. Modificar Cálculo

**Arquivo:** `src/services/fechamentoService.ts`

**Mudanças necessárias:**
- Processar cada viagem individualmente
- Manter rastreamento de viagens múltiplas
- Exibir cada viagem separadamente no PDF

### 4. Modificar PDF

**Arquivo:** `src/services/pdfService.ts`

**Mudanças necessárias:**
- Exibir cada viagem como linha separada
- Manter total correto por motorista

## Exemplo de Implementação

### Frontend - Nova Interface

```typescript
// Adicionar campo para quantidade de viagens
type MotoristaSelecionado = {
  motorista_id: string;
  caminhao_id: string;
  quantidade_viagens: number;
  valor_por_viagem: number;
};

// Interface para múltiplas viagens
const [viagensDetalhadas, setViagensDetalhadas] = useState<{
  [motoristaId: string]: {
    quantidade: number;
    valorIndividual: number;
  }
}>({});
```

### Banco - Nova Estrutura

```sql
-- Adicionar coluna para identificar viagem
ALTER TABLE frete_motorista ADD COLUMN viagem_numero INTEGER DEFAULT 1;
ALTER TABLE frete_caminhao ADD COLUMN viagem_numero INTEGER DEFAULT 1;

-- Índices para performance
CREATE INDEX idx_frete_motorista_viagem ON frete_motorista(frete_id, motorista_id, viagem_numero);
CREATE INDEX idx_frete_caminhao_viagem ON frete_caminhao(frete_id, caminhao_id, viagem_numero);
```

### Cálculo - Nova Lógica

```typescript
// Processar cada viagem individualmente
const processarViagens = async (freteId: number, motoristaId: number) => {
  const viagens = await supabase
    .from('frete_motorista')
    .select('*')
    .eq('frete_id', freteId)
    .eq('motorista_id', motoristaId)
    .order('viagem_numero');

  return viagens.map(viagem => ({
    numero: viagem.viagem_numero,
    valor: viagem.valor_individual,
    caminhao: viagem.caminhao_id
  }));
};
```

## Benefícios da Solução

1. **Flexibilidade:** Aceita qualquer quantidade de viagens por motorista
2. **Precisão:** Cada viagem é registrada individualmente
3. **Rastreabilidade:** Fácil identificar quantas viagens cada motorista fez
4. **Relatórios:** PDFs mostram detalhamento completo
5. **Cálculos:** Valores corretos para fechamento de motoristas

## Impacto no Sistema

### Arquivos a Modificar

1. `src/pages/ControleFrete/ControleFrete.tsx` - Interface
2. `src/services/freteMotoristaService.ts` - Serviço
3. `src/services/freteCaminhaoService.ts` - Serviço
4. `src/services/fechamentoService.ts` - Cálculos
5. `src/services/pdfService.ts` - Relatórios
6. Migrações SQL para banco de dados

### Testes Necessários

1. Criar frete com múltiplas viagens
2. Verificar salvamento no banco
3. Testar cálculos de fechamento
4. Validar geração de PDF
5. Testar edição de fretes existentes

## Conclusão

A implementação de múltiplas viagens requer mudanças significativas no sistema, mas é essencial para atender ao requisito de detalhamento individual de cada viagem do motorista.

**Prioridade:** Alta - Necessário para funcionamento correto do sistema de fretes.

**Tempo estimado:** 2-3 dias de desenvolvimento + testes.

**Riscos:** Baixo - Mudanças são aditivas e não quebram funcionalidade existente.
