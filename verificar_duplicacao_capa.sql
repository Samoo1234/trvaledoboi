-- Verificar dados que estão causando duplicação na capa de transporte
-- Data: 22/07/2025

-- 1. Verificar fretes da data
SELECT 
    id,
    data_emissao,
    origem,
    destino,
    cliente,
    valor_frete
FROM fretes 
WHERE data_emissao = '2025-07-22'
ORDER BY origem;

-- 2. Verificar vínculos de motoristas para esses fretes
SELECT 
    fm.frete_id,
    fm.motorista_id,
    m.nome as motorista_nome,
    f.origem,
    f.destino,
    f.cliente
FROM frete_motorista fm
JOIN motoristas m ON fm.motorista_id = m.id
JOIN fretes f ON fm.frete_id = f.id
WHERE f.data_emissao = '2025-07-22'
ORDER BY f.origem, m.nome;

-- 3. Verificar vínculos de caminhões para esses fretes
SELECT 
    fc.frete_id,
    fc.caminhao_id,
    c.placa as caminhao_placa,
    c.tipo as caminhao_tipo,
    fc.configuracao,
    fc.reboque_id,
    r.placa as reboque_placa,
    f.origem,
    f.destino,
    f.cliente
FROM frete_caminhao fc
JOIN caminhoes c ON fc.caminhao_id = c.id
LEFT JOIN reboque r ON fc.reboque_id = r.id
JOIN fretes f ON fc.frete_id = f.id
WHERE f.data_emissao = '2025-07-22'
ORDER BY f.origem, c.placa;

-- 4. Verificar combinações que estão sendo geradas
-- Simular a lógica do código que está causando duplicação
WITH fretes_data AS (
    SELECT 
        id,
        data_emissao,
        origem,
        destino,
        cliente,
        valor_frete
    FROM fretes 
    WHERE data_emissao = '2025-07-22'
),
motoristas_por_frete AS (
    SELECT 
        fm.frete_id,
        m.nome as motorista_nome
    FROM frete_motorista fm
    JOIN motoristas m ON fm.motorista_id = m.id
    JOIN fretes f ON fm.frete_id = f.id
    WHERE f.data_emissao = '2025-07-22'
),
caminhoes_por_frete AS (
    SELECT 
        fc.frete_id,
        c.placa as caminhao_placa,
        c.tipo as caminhao_tipo,
        fc.configuracao
    FROM frete_caminhao fc
    JOIN caminhoes c ON fc.caminhao_id = c.id
    JOIN fretes f ON fc.frete_id = f.id
    WHERE f.data_emissao = '2025-07-22'
)
SELECT 
    f.id as frete_id,
    f.origem,
    f.destino,
    f.cliente,
    m.motorista_nome,
    c.caminhao_placa,
    c.caminhao_tipo,
    c.configuracao,
    f.valor_frete
FROM fretes_data f
LEFT JOIN motoristas_por_frete m ON f.id = m.frete_id
LEFT JOIN caminhoes_por_frete c ON f.id = c.frete_id
ORDER BY f.origem, m.motorista_nome, c.caminhao_placa; 