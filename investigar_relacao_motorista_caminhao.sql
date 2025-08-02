-- Investigar a relação entre motoristas e caminhões
-- para entender como calcular o valor individual correto

-- 1. Verificar estrutura da tabela caminhoes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'caminhoes'
ORDER BY ordinal_position;

-- 2. Verificar se caminhões têm motorista_id
SELECT 
    id,
    placa,
    motorista_id,
    tipo
FROM caminhoes 
LIMIT 10;

-- 3. Verificar o frete 100 (R$ 16.720) - motoristas envolvidos
SELECT 
    f.id as frete_id,
    f.valor_frete as valor_total,
    f.data_emissao,
    f.origem,
    f.destino,
    m.nome as motorista_nome,
    m.id as motorista_id
FROM fretes f
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE f.id = 100
ORDER BY m.nome;

-- 4. Verificar caminhões do frete 100
SELECT 
    f.id as frete_id,
    f.valor_frete as valor_total_frete,
    fc.valor_frete as valor_individual_caminhao,
    c.placa,
    c.motorista_id,
    m.nome as motorista_nome
FROM fretes f
JOIN frete_caminhao fc ON f.id = fc.frete_id
JOIN caminhoes c ON fc.caminhao_id = c.id
LEFT JOIN motoristas m ON c.motorista_id = m.id
WHERE f.id = 100
ORDER BY c.placa;

-- 5. Verificar se há valores individuais nos caminhões
SELECT 
    fc.frete_id,
    fc.caminhao_id,
    fc.valor_frete as valor_individual_caminhao,
    c.placa,
    c.motorista_id,
    m.nome as motorista_nome,
    f.valor_frete as valor_total_frete
FROM frete_caminhao fc
JOIN caminhoes c ON fc.caminhao_id = c.id
LEFT JOIN motoristas m ON c.motorista_id = m.id
JOIN fretes f ON fc.frete_id = f.id
WHERE fc.valor_frete IS NOT NULL 
   AND fc.valor_frete > 0
ORDER BY fc.frete_id, c.placa;

-- 6. Verificar se há caminhões sem motorista_id
SELECT 
    COUNT(*) as total_caminhoes,
    COUNT(motorista_id) as caminhoes_com_motorista,
    COUNT(*) - COUNT(motorista_id) as caminhoes_sem_motorista
FROM caminhoes;

-- 7. Verificar se há motoristas sem caminhão fixo
SELECT 
    m.id,
    m.nome,
    c.placa
FROM motoristas m
LEFT JOIN caminhoes c ON m.id = c.motorista_id
WHERE c.id IS NULL
ORDER BY m.nome; 