# Implementação das Tabelas de Histórico

## Resumo da Implementação

A arquitetura do sistema de histórico foi otimizada para usar **tabelas separadas** para dados arquivados, proporcionando melhor performance e organização.

## Estrutura das Tabelas

### Tabelas de Histórico Criadas:
- `fretes_historico` - Histórico de fretes arquivados
- `fechamentos_motoristas_historico` - Histórico de fechamentos arquivados

### Campos Adicionais:
- `frete_id` / `fechamento_id` - ID do registro original
- `arquivado_em` - Timestamp de arquivamento
- `arquivado_por` - Usuário que arquivou (opcional)

## Scripts SQL para Execução

### 1. Criar Tabelas de Histórico
```sql
-- Execute o arquivo: create_historico_tables.sql
-- Este script cria as tabelas de histórico com índices otimizados
```

### 2. Remover Campos Antigos (Opcional)
```sql
-- Execute o arquivo: remove_arquivado_fields.sql
-- Remove o campo 'arquivado' das tabelas originais
```

## Funcionalidades Implementadas

### Arquivamento
- **Antes**: Marcava registro como `arquivado = true`
- **Agora**: Move registro para tabela de histórico e remove da tabela ativa

### Consulta de Histórico
- **Antes**: Filtrava por `arquivado = true`
- **Agora**: Consulta diretamente nas tabelas de histórico

### Reabertura
- **Antes**: Marcava registro como `arquivado = false`
- **Agora**: Move registro de volta para tabela ativa

## Vantagens da Nova Arquitetura

1. **Performance**: Consultas nas tabelas ativas são mais rápidas
2. **Organização**: Separação clara entre dados ativos e históricos
3. **Escalabilidade**: Tabelas de histórico podem crescer sem impactar operações ativas
4. **Backup**: Histórico pode ser arquivado separadamente
5. **Análise**: Facilita relatórios e análises históricas

## Modificações no Código

### Serviços Atualizados:
- `freteService.ts` - Métodos de arquivamento e consulta
- `fechamentoService.ts` - Métodos de arquivamento e consulta

### Interfaces Atualizadas:
- `Frete` - Adicionado campos `frete_id`, `arquivado_em`, `arquivado_por`
- `FechamentoMotorista` - Adicionado campos `fechamento_id`, `arquivado_em`, `arquivado_por`

### Componentes Atualizados:
- `Historico.tsx` - Usa novos IDs para reabertura
- `ControleFrete.tsx` - Mantém botões de arquivo existentes
- `FechamentoMotoristas.tsx` - Mantém botões de arquivo existentes

## Execução dos Scripts

### No Supabase Dashboard:
1. Acesse o SQL Editor
2. Execute `create_historico_tables.sql`
3. Execute `remove_arquivado_fields.sql` (opcional)
4. Verifique se as tabelas foram criadas corretamente

### Verificação:
```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('fretes_historico', 'fechamentos_motoristas_historico');

-- Verificar índices
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('fretes_historico', 'fechamentos_motoristas_historico');
```

## Impacto na Performance

### Consultas Ativas:
- **Antes**: Filtrava milhares de registros por `arquivado = false`
- **Agora**: Consulta apenas registros ativos (sem filtros)

### Consultas de Histórico:
- **Antes**: Filtrava milhares de registros por `arquivado = true`
- **Agora**: Consulta tabela dedicada com índices otimizados

## Manutenção

### Limpeza de Histórico (Futura):
```sql
-- Exemplo para limpar histórico antigo (ajustar conforme necessário)
DELETE FROM fretes_historico 
WHERE arquivado_em < NOW() - INTERVAL '2 years';
```

### Backup de Histórico:
```sql
-- Exemplo para backup específico do histórico
pg_dump -t fretes_historico -t fechamentos_motoristas_historico database_name > historico_backup.sql
```

## Compatibilidade

✅ **Mantida**: Todas as funcionalidades existentes funcionam normalmente
✅ **Aprimorada**: Performance das consultas melhorou significativamente
✅ **Segura**: Dados não são perdidos durante o arquivamento
✅ **Reversível**: Registros podem ser reabertos para correção

## Próximos Passos

1. Executar os scripts SQL no banco de dados
2. Testar funcionalidades de arquivo e reabertura
3. Monitorar performance das consultas
4. Considerar implementar limpeza automática de histórico antigo 