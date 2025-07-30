-- Verificar dados do reboque OMT2D28
-- Este script vai investigar por que o reboque OMT2D28 está aparecendo como "Julieta" em vez de "Carreta Baixa"

-- 1. Verificar dados do reboque na tabela reboque
SELECT 
    id,
    placa,
    conjunto,
    caminhao_id,
    created_at
FROM reboque 
WHERE placa = 'OMT2D28';

-- 2. Verificar se existe algum frete_caminhao usando este reboque
SELECT 
    fc.id,
    fc.frete_id,
    fc.caminhao_id,
    fc.configuracao,
    fc.reboque_id,
    fc.valor_frete,
    r.placa as reboque_placa,
    r.conjunto as reboque_conjunto,
    c.placa as caminhao_placa,
    c.tipo as caminhao_tipo
FROM frete_caminhao fc
LEFT JOIN reboque r ON fc.reboque_id = r.id
LEFT JOIN caminhoes c ON fc.caminhao_id = c.id
WHERE r.placa = 'OMT2D28';

-- 3. Verificar todos os reboques para comparar
SELECT 
    id,
    placa,
    conjunto,
    caminhao_id
FROM reboque 
ORDER BY placa;

-- 4. Verificar a estrutura da tabela reboque
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'reboque'
ORDER BY ordinal_position;

-- 5. Verificar se há algum problema de case sensitivity
SELECT 
    placa,
    conjunto,
    LOWER(conjunto) as conjunto_lower,
    UPPER(conjunto) as conjunto_upper
FROM reboque 
WHERE placa = 'OMT2D28'; 