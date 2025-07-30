-- Verificar estrutura da tabela caminhoes e valores do campo tipo
-- Este script vai mostrar de onde vem o "tipo de veículo" na capa de transporte

-- 1. Verificar estrutura da tabela caminhoes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'caminhoes'
ORDER BY ordinal_position;

-- 2. Verificar valores únicos do campo tipo na tabela caminhoes
SELECT 
    tipo,
    COUNT(*) as quantidade
FROM caminhoes
GROUP BY tipo
ORDER BY tipo;

-- 3. Verificar alguns exemplos de caminhões com seus tipos
SELECT 
    id,
    placa,
    tipo,
    created_at
FROM caminhoes
ORDER BY placa
LIMIT 10;

-- 4. Verificar como o tipo está sendo usado na tabela frete_caminhao
SELECT 
    fc.id,
    fc.frete_id,
    fc.caminhao_id,
    c.placa as caminhao_placa,
    c.tipo as caminhao_tipo,
    fc.configuracao,
    f.origem,
    f.destino
FROM frete_caminhao fc
JOIN caminhoes c ON fc.caminhao_id = c.id
JOIN fretes f ON fc.frete_id = f.id
WHERE f.data_emissao = '2025-07-22'
ORDER BY c.placa;

-- 5. Comparar tipo vs configuração
SELECT 
    c.placa,
    c.tipo as tipo_caminhao,
    fc.configuracao as configuracao_frete,
    CASE 
        WHEN c.tipo = fc.configuracao THEN 'IGUAL'
        ELSE 'DIFERENTE'
    END as comparacao
FROM frete_caminhao fc
JOIN caminhoes c ON fc.caminhao_id = c.id
JOIN fretes f ON fc.frete_id = f.id
WHERE f.data_emissao = '2025-07-22'
ORDER BY c.placa; 