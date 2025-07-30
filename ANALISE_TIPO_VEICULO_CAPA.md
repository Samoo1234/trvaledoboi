# ANÁLISE: Tipo de Veículo na Capa de Transporte

## Resumo da Investigação

### Origem dos Dados

**Capa de Transporte** usa o campo `tipo` da tabela `caminhoes`:
```sql
-- Busca em capaService.ts linha 67-72
SELECT caminhao:caminhoes(id, placa, tipo)
```

**Controle de Fretes** usa o campo `configuracao` da tabela `frete_caminhao`:
```sql
-- Busca em ControleFrete.tsx
SELECT configuracao FROM frete_caminhao
```

### Diferença Conceitual

1. **`caminhoes.tipo`**: Tipo cadastrado do caminhão (ex: "Truck", "Julieta", "Carreta Baixa")
2. **`frete_caminhao.configuracao`**: Como o caminhão está sendo usado no frete específico

### Possíveis Inconsistências

**Cenário 1: Caminhão cadastrado como "Truck" mas usado como "Julieta"**
- `caminhoes.tipo` = "Truck"
- `frete_caminhao.configuracao` = "Julieta"
- **Capa**: Mostra "Truck"
- **Controle**: Mostra "Julieta"

**Cenário 2: Caminhão cadastrado como "Carreta Baixa" mas usado como "Julieta"**
- `caminhoes.tipo` = "Carreta Baixa"
- `frete_caminhao.configuracao` = "Julieta"
- **Capa**: Mostra "Carreta Baixa"
- **Controle**: Mostra "Julieta"

### Scripts de Verificação Criados

1. **`verificar_tipo_caminhao.sql`**: Estrutura geral da tabela caminhoes
2. **`verificar_inconsistencia_tipo_configuracao.sql`**: Comparação entre tipo e configuração
3. **`verificar_dados_especificos_capa.sql`**: Dados específicos dos caminhões das imagens

### Próximos Passos

Para resolver inconsistências, você pode:

1. **Executar os scripts SQL** para ver os dados reais
2. **Decidir qual campo usar**:
   - Manter `caminhoes.tipo` (tipo cadastrado)
   - Usar `frete_caminhao.configuracao` (como está sendo usado)
   - Criar lógica híbrida

3. **Padronizar os dados** se necessário

### Recomendação

**Usar `frete_caminhao.configuracao`** na capa de transporte, pois:
- Reflete como o caminhão está sendo usado no frete
- É consistente com o controle de fretes
- Mostra a configuração real do transporte

**Alteração necessária**: Modificar `capaService.ts` para buscar `configuracao` em vez de `tipo`. 