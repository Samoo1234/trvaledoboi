-- Script para verificar dados na tabela fretes e relacionamentos
-- Verificar se os motoristas e caminhões estão sendo retornados corretamente

-- 1. Verificar estrutura da tabela fretes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'fretes'
ORDER BY ordinal_position;

-- 2. Verificar chaves estrangeiras
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'fretes';

-- 3. Verificar dados de exemplo na tabela fretes
SELECT 
    id,
    data_emissao,
    origem,
    destino,
    cliente,
    motorista_id,
    caminhao_id,
    valor_frete
FROM fretes
ORDER BY data_emissao DESC
LIMIT 10;

-- 4. Verificar se há dados nas tabelas relacionadas
SELECT 
    'motoristas' as tabela,
    COUNT(*) as total
FROM motoristas
UNION ALL
SELECT 
    'caminhoes' as tabela,
    COUNT(*) as total
FROM caminhoes;

-- 5. Testar JOIN manual
SELECT 
    f.id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.cliente,
    f.motorista_id,
    f.caminhao_id,
    m.nome as motorista_nome,
    c.placa as caminhao_placa,
    c.tipo as caminhao_tipo
FROM fretes f
LEFT JOIN motoristas m ON f.motorista_id = m.id
LEFT JOIN caminhoes c ON f.caminhao_id = c.id
ORDER BY f.data_emissao DESC
LIMIT 10;

-- 6. Verificar fretes sem motorista ou caminhão
SELECT 
    'Fretes sem motorista' as tipo,
    COUNT(*) as quantidade
FROM fretes
WHERE motorista_id IS NULL
UNION ALL
SELECT 
    'Fretes sem caminhão' as tipo,
    COUNT(*) as quantidade
FROM fretes
WHERE caminhao_id IS NULL;

-- 7. Verificar dados de hoje (se houver)
SELECT 
    'Fretes de hoje' as tipo,
    COUNT(*) as quantidade
FROM fretes
WHERE data_emissao = CURRENT_DATE; 