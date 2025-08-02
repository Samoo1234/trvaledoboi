-- Script para verificar a estrutura da tabela fretes
-- e identificar como os motoristas são vinculados aos fretes

-- 1. Verificar estrutura completa da tabela fretes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'fretes'
ORDER BY ordinal_position;

-- 2. Verificar se existe campo motorista_id na tabela fretes
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'fretes'
    AND column_name = 'motorista_id';

-- 3. Verificar estrutura da tabela frete_motorista (relacionamento)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'frete_motorista'
ORDER BY ordinal_position;

-- 4. Verificar dados de exemplo na tabela frete_motorista
SELECT 
    fm.id,
    fm.frete_id,
    fm.motorista_id,
    f.data_emissao,
    f.origem,
    f.destino,
    m.nome as motorista_nome
FROM frete_motorista fm
JOIN fretes f ON fm.frete_id = f.id
JOIN motoristas m ON fm.motorista_id = m.id
ORDER BY f.data_emissao DESC
LIMIT 10;

-- 5. Verificar se há fretes sem vínculo de motorista
SELECT 
    'Fretes sem vínculo de motorista' as tipo,
    COUNT(*) as quantidade
FROM fretes f
LEFT JOIN frete_motorista fm ON f.id = fm.frete_id
WHERE fm.frete_id IS NULL;

-- 6. Verificar fretes do motorista Fabiano Alexandre de Oliveira após 20/07/2025
SELECT 
    f.id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.valor_frete,
    m.nome as motorista_nome
FROM fretes f
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE m.nome ILIKE '%Fabiano Alexandre de Oliveira%'
    AND f.data_emissao > '2025-07-20'
ORDER BY f.data_emissao DESC;

-- 7. Verificar total de fretes do motorista Fabiano
SELECT 
    m.nome as motorista_nome,
    COUNT(*) as total_fretes,
    SUM(f.valor_frete) as valor_total
FROM fretes f
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE m.nome ILIKE '%Fabiano Alexandre de Oliveira%'
GROUP BY m.nome; 