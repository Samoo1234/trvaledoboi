-- Script para testar a query usada no capaService
-- Verificar se os dados de motoristas e caminhões estão sendo retornados

-- 1. Verificar estrutura da tabela fretes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'fretes'
ORDER BY ordinal_position;

-- 2. Verificar se existem chaves estrangeiras para motoristas e caminhões
SELECT 
    constraint_name,
    column_name,
    foreign_table_name,
    foreign_column_name
FROM information_schema.key_column_usage k
JOIN information_schema.table_constraints t ON k.constraint_name = t.constraint_name
WHERE t.constraint_type = 'FOREIGN KEY'
    AND k.table_name = 'fretes'
    AND k.column_name IN ('motorista_id', 'caminhao_id');

-- 3. Testar a query exata do capaService
SELECT 
    f.id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.cliente,
    f.valor_frete,
    m.nome as motorista_nome,
    c.placa as caminhao_placa,
    c.tipo as caminhao_tipo
FROM fretes f
LEFT JOIN motoristas m ON f.motorista_id = m.id
LEFT JOIN caminhoes c ON f.caminhao_id = c.id
WHERE f.data_emissao = CURRENT_DATE
ORDER BY f.origem;

-- 4. Verificar se há dados de exemplo
SELECT 
    'Total de fretes' as tipo,
    COUNT(*) as quantidade
FROM fretes
UNION ALL
SELECT 
    'Fretes com motorista_id' as tipo,
    COUNT(*) as quantidade
FROM fretes
WHERE motorista_id IS NOT NULL
UNION ALL
SELECT 
    'Fretes com caminhao_id' as tipo,
    COUNT(*) as quantidade
FROM fretes
WHERE caminhao_id IS NOT NULL;

-- 5. Verificar dados de motoristas e caminhões
SELECT 
    'Motoristas' as tipo,
    COUNT(*) as quantidade
FROM motoristas
UNION ALL
SELECT 
    'Caminhões' as tipo,
    COUNT(*) as quantidade
FROM caminhoes;

-- 6. Verificar alguns registros de exemplo
SELECT 
    f.id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.cliente,
    f.motorista_id,
    f.caminhao_id,
    m.nome as motorista_nome,
    c.placa as caminhao_placa
FROM fretes f
LEFT JOIN motoristas m ON f.motorista_id = m.id
LEFT JOIN caminhoes c ON f.caminhao_id = c.id
LIMIT 5; 