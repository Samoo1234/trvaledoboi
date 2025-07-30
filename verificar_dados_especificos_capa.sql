-- Verificar dados específicos que aparecem nas imagens da capa de transporte
-- Foco nos caminhões JYN1A15, LTD3788, SP12882, SPZ5H94 que aparecem nas imagens

-- 1. Verificar dados dos caminhões específicos
SELECT 
    'DADOS CADASTRO' as fonte,
    c.placa,
    c.tipo as tipo_caminhao,
    'N/A' as configuracao_frete,
    'N/A' as reboque_placa
FROM caminhoes c
WHERE c.placa IN ('JYN1A15', 'LTD3788', 'SP12882', 'SPZ5H94')
ORDER BY c.placa;

-- 2. Verificar como esses caminhões estão sendo usados nos fretes de 22/07/2025
SELECT 
    'USO NOS FRETES' as fonte,
    c.placa,
    c.tipo as tipo_caminhao,
    fc.configuracao as configuracao_frete,
    r.placa as reboque_placa,
    f.origem,
    f.destino,
    f.cliente
FROM frete_caminhao fc
JOIN caminhoes c ON fc.caminhao_id = c.id
LEFT JOIN reboque r ON fc.reboque_id = r.id
JOIN fretes f ON fc.frete_id = f.id
WHERE f.data_emissao = '2025-07-22'
  AND c.placa IN ('JYN1A15', 'LTD3788', 'SP12882', 'SPZ5H94')
ORDER BY c.placa;

-- 3. Verificar motoristas associados a esses caminhões
SELECT 
    'MOTORISTAS ASSOCIADOS' as fonte,
    c.placa,
    c.tipo as tipo_caminhao,
    fc.configuracao as configuracao_frete,
    m.nome as motorista_nome,
    f.origem,
    f.destino
FROM frete_caminhao fc
JOIN caminhoes c ON fc.caminhao_id = c.id
JOIN fretes f ON fc.frete_id = f.id
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE f.data_emissao = '2025-07-22'
  AND c.placa IN ('JYN1A15', 'LTD3788', 'SP12882', 'SPZ5H94')
ORDER BY c.placa, m.nome;

-- 4. Simular exatamente o que a capa de transporte está buscando
-- (usando a lógica do capaService.ts)
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
    'SIMULAÇÃO CAPA' as fonte,
    f.id as frete_id,
    f.origem,
    f.destino,
    f.cliente,
    m.motorista_nome,
    c.caminhao_placa,
    c.caminhao_tipo as tipo_exibido_capa,
    c.configuracao as configuracao_frete,
    f.valor_frete
FROM fretes_data f
LEFT JOIN motoristas_por_frete m ON f.id = m.frete_id
LEFT JOIN caminhoes_por_frete c ON f.id = c.frete_id
WHERE c.caminhao_placa IN ('JYN1A15', 'LTD3788', 'SP12882', 'SPZ5H94')
ORDER BY f.origem, m.motorista_nome, c.caminhao_placa;

-- 5. Verificar se há diferença entre tipo e configuração para esses caminhões
SELECT 
    'COMPARAÇÃO TIPO vs CONFIG' as fonte,
    c.placa,
    c.tipo as tipo_caminhao,
    fc.configuracao as configuracao_frete,
    CASE 
        WHEN c.tipo = fc.configuracao THEN '✅ IGUAL'
        ELSE '❌ DIFERENTE'
    END as comparacao,
    f.origem,
    f.destino
FROM frete_caminhao fc
JOIN caminhoes c ON fc.caminhao_id = c.id
JOIN fretes f ON fc.frete_id = f.id
WHERE f.data_emissao = '2025-07-22'
  AND c.placa IN ('JYN1A15', 'LTD3788', 'SP12882', 'SPZ5H94')
ORDER BY c.placa; 