-- Script para verificar o estado atual do banco de dados
-- e identificar problemas com as tabelas de histórico

-- 1. Verificar se as tabelas de histórico existem
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('fretes_historico', 'fechamentos_motoristas_historico') THEN 'Tabela de Histórico'
        ELSE 'Tabela Principal'
    END as tipo_tabela
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('fretes', 'fretes_historico', 'fechamentos_motoristas', 'fechamentos_motoristas_historico')
ORDER BY table_name;

-- 2. Verificar se as tabelas principais têm o campo 'arquivado' (não deveria ter)
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN ('fretes', 'fechamentos_motoristas')
    AND column_name = 'arquivado';

-- 3. Contar registros nas tabelas
SELECT 
    'fretes' as tabela,
    COUNT(*) as total_registros
FROM fretes
UNION ALL
SELECT 
    'fretes_historico' as tabela,
    COUNT(*) as total_registros
FROM fretes_historico
UNION ALL
SELECT 
    'fechamentos_motoristas' as tabela,
    COUNT(*) as total_registros
FROM fechamentos_motoristas
UNION ALL
SELECT 
    'fechamentos_motoristas_historico' as tabela,
    COUNT(*) as total_registros
FROM fechamentos_motoristas_historico;

-- 4. Verificar estrutura das tabelas de histórico
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN ('fretes_historico', 'fechamentos_motoristas_historico')
ORDER BY table_name, ordinal_position;

-- 5. Verificar se há dados para potencialmente arquivar
SELECT 
    'Fretes antigos (>6 meses)' as categoria,
    COUNT(*) as quantidade
FROM fretes 
WHERE data_emissao < CURRENT_DATE - INTERVAL '6 months'
UNION ALL
SELECT 
    'Fechamentos antigos (>6 meses)' as categoria,
    COUNT(*) as quantidade
FROM fechamentos_motoristas 
WHERE data_fechamento < CURRENT_DATE - INTERVAL '6 months'
    AND data_fechamento IS NOT NULL;

-- 6. Verificar integridade das chaves estrangeiras
SELECT 
    constraint_name,
    table_name,
    column_name,
    foreign_table_name,
    foreign_column_name
FROM information_schema.key_column_usage k
JOIN information_schema.table_constraints t ON k.constraint_name = t.constraint_name
WHERE t.constraint_type = 'FOREIGN KEY'
    AND k.table_name IN ('fretes_historico', 'fechamentos_motoristas_historico'); 