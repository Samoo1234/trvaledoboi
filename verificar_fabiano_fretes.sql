-- Verificar fretes do motorista Fabiano Alexandre de Oliveira após 20/07/2025
-- e identificar por que não aparecem no relatório de fechamento

-- 1. Verificar se o motorista existe
SELECT 
    id,
    nome,
    tipo_motorista,
    status
FROM motoristas 
WHERE nome ILIKE '%Fabiano Alexandre de Oliveira%';

-- 2. Verificar fretes vinculados ao motorista Fabiano após 20/07/2025
SELECT 
    f.id as frete_id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.valor_frete,
    f.situacao,
    m.nome as motorista_nome,
    m.id as motorista_id
FROM fretes f
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE m.nome ILIKE '%Fabiano Alexandre de Oliveira%'
    AND f.data_emissao > '2025-07-20'
ORDER BY f.data_emissao DESC;

-- 3. Verificar se há campo motorista_id na tabela fretes
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'fretes'
    AND column_name = 'motorista_id';

-- 4. Verificar estrutura da tabela frete_motorista
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'frete_motorista'
ORDER BY ordinal_position;

-- 5. Verificar total de fretes do Fabiano por período
SELECT 
    DATE_TRUNC('month', f.data_emissao::date) as mes,
    COUNT(*) as total_fretes,
    SUM(f.valor_frete) as valor_total
FROM fretes f
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE m.nome ILIKE '%Fabiano Alexandre de Oliveira%'
    AND f.data_emissao >= '2025-07-01'
GROUP BY DATE_TRUNC('month', f.data_emissao::date)
ORDER BY mes; 