-- Script para verificar as tabelas de relacionamento
-- frete_motorista e frete_caminhao

-- 1. Verificar se as tabelas existem
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'frete_motorista' THEN 'Tabela de relacionamento motoristas'
        WHEN table_name = 'frete_caminhao' THEN 'Tabela de relacionamento caminhões'
        ELSE 'Outra tabela'
    END as descricao
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('frete_motorista', 'frete_caminhao')
ORDER BY table_name;

-- 2. Verificar estrutura da tabela frete_motorista
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'frete_motorista'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela frete_caminhao
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'frete_caminhao'
ORDER BY ordinal_position;

-- 4. Verificar dados nas tabelas de relacionamento
SELECT 
    'frete_motorista' as tabela,
    COUNT(*) as total_registros
FROM frete_motorista
UNION ALL
SELECT 
    'frete_caminhao' as tabela,
    COUNT(*) as total_registros
FROM frete_caminhao;

-- 5. Verificar alguns registros de exemplo
SELECT 
    'frete_motorista' as tabela,
    fm.frete_id,
    fm.motorista_id,
    m.nome as motorista_nome,
    f.origem,
    f.destino,
    f.data_emissao
FROM frete_motorista fm
LEFT JOIN motoristas m ON fm.motorista_id = m.id
LEFT JOIN fretes f ON fm.frete_id = f.id
ORDER BY f.data_emissao DESC
LIMIT 5;

SELECT 
    'frete_caminhao' as tabela,
    fc.frete_id,
    fc.caminhao_id,
    c.placa as caminhao_placa,
    c.tipo as caminhao_tipo,
    f.origem,
    f.destino,
    f.data_emissao
FROM frete_caminhao fc
LEFT JOIN caminhoes c ON fc.caminhao_id = c.id
LEFT JOIN fretes f ON fc.frete_id = f.id
ORDER BY f.data_emissao DESC
LIMIT 5;

-- 6. Verificar fretes que têm vínculos
SELECT 
    'Fretes com motoristas' as tipo,
    COUNT(DISTINCT frete_id) as quantidade
FROM frete_motorista
UNION ALL
SELECT 
    'Fretes com caminhões' as tipo,
    COUNT(DISTINCT frete_id) as quantidade
FROM frete_caminhao;

-- 7. Verificar fretes de hoje que têm vínculos
SELECT 
    'Fretes de hoje com motoristas' as tipo,
    COUNT(DISTINCT fm.frete_id) as quantidade
FROM frete_motorista fm
JOIN fretes f ON fm.frete_id = f.id
WHERE f.data_emissao = CURRENT_DATE
UNION ALL
SELECT 
    'Fretes de hoje com caminhões' as tipo,
    COUNT(DISTINCT fc.frete_id) as quantidade
FROM frete_caminhao fc
JOIN fretes f ON fc.frete_id = f.id
WHERE f.data_emissao = CURRENT_DATE; 