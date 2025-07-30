-- Verificar inconsistências entre tipo do caminhão e configuração do frete
-- Este script vai mostrar se há diferenças entre os dados exibidos na capa vs controle de fretes

-- 1. Verificar todos os caminhões cadastrados e seus tipos
SELECT 
    'CADASTRO CAMINHÕES' as fonte,
    placa,
    tipo as tipo_caminhao,
    'N/A' as configuracao_frete,
    'N/A' as origem,
    'N/A' as destino
FROM caminhoes
ORDER BY placa;

-- 2. Verificar todos os fretes da data 22/07/2025 com suas configurações
SELECT 
    'FRETES 22/07/2025' as fonte,
    c.placa,
    c.tipo as tipo_caminhao,
    fc.configuracao as configuracao_frete,
    f.origem,
    f.destino
FROM frete_caminhao fc
JOIN caminhoes c ON fc.caminhao_id = c.id
JOIN fretes f ON fc.frete_id = f.id
WHERE f.data_emissao = '2025-07-22'
ORDER BY c.placa;

-- 3. Comparar diretamente tipo vs configuração para a data específica
SELECT 
    c.placa,
    c.tipo as tipo_caminhao,
    fc.configuracao as configuracao_frete,
    CASE 
        WHEN c.tipo = fc.configuracao THEN '✅ IGUAL'
        WHEN c.tipo IS NULL AND fc.configuracao IS NULL THEN '✅ AMBOS NULL'
        WHEN c.tipo IS NULL THEN '❌ TIPO NULL'
        WHEN fc.configuracao IS NULL THEN '❌ CONFIG NULL'
        ELSE '❌ DIFERENTE'
    END as status,
    f.origem,
    f.destino,
    f.cliente
FROM frete_caminhao fc
JOIN caminhoes c ON fc.caminhao_id = c.id
JOIN fretes f ON fc.frete_id = f.id
WHERE f.data_emissao = '2025-07-22'
ORDER BY c.placa;

-- 4. Verificar valores únicos de tipo na tabela caminhoes
SELECT 
    'TIPOS CADASTRADOS' as categoria,
    tipo,
    COUNT(*) as quantidade
FROM caminhoes
GROUP BY tipo
ORDER BY tipo;

-- 5. Verificar valores únicos de configuração na tabela frete_caminhao
SELECT 
    'CONFIGURAÇÕES USADAS' as categoria,
    configuracao,
    COUNT(*) as quantidade
FROM frete_caminhao fc
JOIN fretes f ON fc.frete_id = f.id
WHERE f.data_emissao = '2025-07-22'
GROUP BY configuracao
ORDER BY configuracao;

-- 6. Verificar se há caminhões que não estão sendo usados em fretes
SELECT 
    'CAMINHÕES NÃO USADOS' as status,
    c.placa,
    c.tipo,
    'N/A' as configuracao
FROM caminhoes c
LEFT JOIN frete_caminhao fc ON c.id = fc.caminhao_id
LEFT JOIN fretes f ON fc.frete_id = f.id AND f.data_emissao = '2025-07-22'
WHERE f.id IS NULL
ORDER BY c.placa; 