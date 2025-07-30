# CORREÇÃO: Duplicação na Capa de Transporte

## Problema Identificado

A capa de transporte está duplicando registros devido à lógica na função `getTransportesByData` do `capaService.ts`.

### Causa Raiz

Na linha 175-185 do `capaService.ts`:

```typescript
// Se há ambos, criar um registro para cada combinação
motoristas.forEach(motorista => {
  caminhoes.forEach(caminhao => {
    result.push({
      // ... dados do frete
      motorista: motorista,
      caminhao_placa: caminhao.placa,
      caminhao_tipo: caminhao.tipo,
      valor_frete: frete.valor_frete
    });
  });
});
```

Esta lógica cria um registro para **cada combinação** de motorista + caminhão:
- 2 motoristas + 2 caminhões = 4 registros
- 1 motorista + 2 caminhões = 2 registros  
- 2 motoristas + 1 caminhão = 2 registros

### Evidência do Problema

**Print 1 (Capa de Transporte):**
- Mostra 6 transportes encontrados
- Mesmo motorista "WILSON BEZERRA DA SILVA" aparece 2x com veículos diferentes
- Mesmo motorista "AUGUSTO BUENO CARNEIROS" aparece 2x com os mesmos veículos

**Print 2 (Controle de Fretes):**
- Mostra apenas 3 fretes reais
- Mas na capa aparecem 6 transportes (duplicação)

## Solução Proposta

### Opção 1: Agrupar em um único registro por frete
- Mostrar todos os motoristas e caminhões de um frete em um único registro
- Separar por vírgulas ou quebras de linha
- Exemplo: "WILSON, AUGUSTO" + "JYN1A15, LTD3788"

### Opção 2: Criar registros separados apenas quando necessário
- Se um motorista está associado a um caminhão específico, criar registro único
- Se não há associação específica, agrupar em um registro
- Usar a tabela `frete_motorista_caminhao` se existir

### Opção 3: Manter a lógica atual mas com identificação clara
- Manter os registros separados mas adicionar identificador de grupo
- Agrupar visualmente no PDF por frete

## Recomendação

**Opção 1** é a mais simples e resolve o problema de duplicação, mantendo a informação completa mas organizada.

## Implementação Necessária

1. Modificar a função `getTransportesByData` em `capaService.ts`
2. Alterar a lógica de criação de registros
3. Ajustar o PDF para exibir múltiplos motoristas/caminhões por registro
4. Testar com dados reais

## Arquivos Afetados

- `src/services/capaService.ts` - Lógica de busca e agrupamento
- `src/pages/CapaTransporte/CapaTransporte.tsx` - Exibição dos dados
- Possivelmente `src/services/pdfService.ts` - Geração do PDF 