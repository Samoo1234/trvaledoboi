-- Script para atualizar valores individuais dos caminhões
-- nos fretes existentes que têm valor_frete NULL

-- 1. Verificar fretes que precisam ser atualizados
SELECT 
    fc.frete_id,
    f.valor_frete as valor_total_frete,
    COUNT(fc.id) as total_caminhoes,
    COUNT(CASE WHEN fc.valor_frete IS NULL THEN 1 END) as caminhoes_sem_valor
FROM frete_caminhao fc
JOIN fretes f ON fc.frete_id = f.id
GROUP BY fc.frete_id, f.valor_frete
HAVING COUNT(CASE WHEN fc.valor_frete IS NULL THEN 1 END) > 0
ORDER BY fc.frete_id;

-- 2. Atualizar valores individuais dividindo igualmente
-- Para cada frete, dividir o valor total pelo número de caminhões
UPDATE frete_caminhao 
SET valor_frete = (
    SELECT f.valor_frete / COUNT(fc2.id)
    FROM fretes f
    JOIN frete_caminhao fc2 ON f.id = fc2.frete_id
    WHERE fc2.frete_id = frete_caminhao.frete_id
    GROUP BY f.valor_frete, fc2.frete_id
)
WHERE valor_frete IS NULL;

-- 3. Verificar resultado
SELECT 
    fc.frete_id,
    f.valor_frete as valor_total_frete,
    fc.valor_frete as valor_individual_caminhao,
    c.placa,
    f.data_emissao,
    f.origem,
    f.destino
FROM frete_caminhao fc
JOIN fretes f ON fc.frete_id = f.id
JOIN caminhoes c ON fc.caminhao_id = c.id
WHERE fc.valor_frete IS NOT NULL
ORDER BY fc.frete_id, c.placa;

-- 4. Verificar especificamente o frete 100 (R$ 16.720)
SELECT 
    fc.frete_id,
    f.valor_frete as valor_total_frete,
    fc.valor_frete as valor_individual_caminhao,
    c.placa,
    f.data_emissao,
    f.origem,
    f.destino
FROM frete_caminhao fc
JOIN fretes f ON fc.frete_id = f.id
JOIN caminhoes c ON fc.caminhao_id = c.id
WHERE fc.frete_id = 100
ORDER BY c.placa; 