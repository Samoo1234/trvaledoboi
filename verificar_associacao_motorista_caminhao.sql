-- Verificar se há associação entre motoristas e caminhões específicos
-- para calcular o valor individual de cada motorista

-- 1. Verificar se existe tabela motorista_caminhao
SELECT 
    table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_name LIKE '%motorista%caminhao%';

-- 2. Verificar se existe tabela caminhao_motorista
SELECT 
    table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_name LIKE '%caminhao%motorista%';

-- 3. Verificar se existe campo motorista_id na tabela caminhoes
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'caminhoes'
    AND column_name LIKE '%motorista%';

-- 4. Verificar se existe campo caminhao_id na tabela motoristas
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'motoristas'
    AND column_name LIKE '%caminhao%';

-- 5. Verificar dados dos caminhões para ver se há motorista associado
SELECT 
    c.id,
    c.placa,
    c.tipo,
    c.modelo,
    c.status
FROM caminhoes c
ORDER BY c.placa;

-- 6. Verificar dados dos motoristas para ver se há caminhão associado
SELECT 
    m.id,
    m.nome,
    m.tipo_motorista,
    m.status
FROM motoristas m
ORDER BY m.nome;

-- 7. Verificar se há alguma lógica de associação no frete específico
SELECT 
    f.id as frete_id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.valor_frete as valor_total,
    COUNT(DISTINCT fc.caminhao_id) as total_caminhoes,
    COUNT(DISTINCT fm.motorista_id) as total_motoristas
FROM fretes f
LEFT JOIN frete_caminhao fc ON f.id = fc.frete_id
LEFT JOIN frete_motorista fm ON f.id = fm.frete_id
WHERE f.data_emissao = '2025-07-30'
    AND f.origem ILIKE '%AGROCENTRO%'
    AND f.destino ILIKE '%FAZ ESPINHAÇO%'
GROUP BY f.id, f.data_emissao, f.origem, f.destino, f.valor_frete; 