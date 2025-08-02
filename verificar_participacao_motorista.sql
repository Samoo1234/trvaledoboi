-- Verificar se existe campo de participação individual dos motoristas
-- na tabela frete_motorista

-- 1. Verificar estrutura da tabela frete_motorista
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'frete_motorista'
ORDER BY ordinal_position;

-- 2. Verificar dados da tabela frete_motorista para o frete 100 (R$ 16.720)
SELECT 
    fm.frete_id,
    fm.motorista_id,
    m.nome as motorista_nome,
    f.valor_frete as valor_total_frete,
    f.data_emissao,
    f.origem,
    f.destino
FROM frete_motorista fm
JOIN motoristas m ON fm.motorista_id = m.id
JOIN fretes f ON fm.frete_id = f.id
WHERE f.id = 100
ORDER BY m.nome;

-- 3. Verificar se existe algum campo de valor individual ou participação
SELECT 
    fm.*,
    m.nome as motorista_nome,
    f.valor_frete as valor_total_frete
FROM frete_motorista fm
JOIN motoristas m ON fm.motorista_id = m.id
JOIN fretes f ON fm.frete_id = f.id
WHERE f.id = 100
ORDER BY m.nome;

-- 4. Verificar se existe tabela frete_caminhao com valores individuais
SELECT 
    fc.frete_id,
    fc.caminhao_id,
    c.placa,
    fc.valor_frete as valor_individual_caminhao,
    f.valor_frete as valor_total_frete
FROM frete_caminhao fc
JOIN caminhoes c ON fc.caminhao_id = c.id
JOIN fretes f ON fc.frete_id = f.id
WHERE f.id = 100;

-- 5. Verificar se existe alguma tabela de participação de motoristas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%motorista%' 
   OR table_name LIKE '%participacao%'
   OR table_name LIKE '%valor%'
ORDER BY table_name; 