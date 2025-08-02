-- Verificar como os valores são distribuídos entre os motoristas
-- no frete do dia 30/07/2025 (AGROCENTRO -> FAZ ESPINHAÇO -> FAZ BICO DA SERRA)

-- 1. Encontrar o frete específico
SELECT 
    f.id as frete_id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.valor_frete as valor_total_frete,
    f.situacao
FROM fretes f
WHERE f.data_emissao = '2025-07-30'
    AND f.origem ILIKE '%AGROCENTRO%'
    AND f.destino ILIKE '%FAZ ESPINHAÇO%'
ORDER BY f.id;

-- 2. Verificar todos os motoristas vinculados a este frete
SELECT 
    f.id as frete_id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.valor_frete as valor_total_frete,
    m.nome as motorista_nome,
    m.id as motorista_id,
    fm.id as vinculo_id
FROM fretes f
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE f.data_emissao = '2025-07-30'
    AND f.origem ILIKE '%AGROCENTRO%'
    AND f.destino ILIKE '%FAZ ESPINHAÇO%'
ORDER BY m.nome;

-- 3. Verificar se há campo de valor individual na tabela frete_motorista
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'frete_motorista'
ORDER BY ordinal_position;

-- 4. Verificar se há campo de valor individual na tabela frete_caminhao
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'frete_caminhao'
ORDER BY ordinal_position;

-- 5. Verificar todos os caminhões vinculados a este frete
SELECT 
    f.id as frete_id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.valor_frete as valor_total_frete,
    c.placa as caminhao_placa,
    c.tipo as caminhao_tipo,
    fc.configuracao,
    fc.valor_frete as valor_individual_caminhao,
    fc.id as vinculo_caminhao_id
FROM fretes f
JOIN frete_caminhao fc ON f.id = fc.frete_id
JOIN caminhoes c ON fc.caminhao_id = c.id
WHERE f.data_emissao = '2025-07-30'
    AND f.origem ILIKE '%AGROCENTRO%'
    AND f.destino ILIKE '%FAZ ESPINHAÇO%'
ORDER BY c.placa;

-- 6. Verificar se há relacionamento entre motoristas e caminhões
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'motorista_caminhao'
ORDER BY ordinal_position; 