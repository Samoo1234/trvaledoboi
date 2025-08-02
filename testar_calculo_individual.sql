-- Testar a lógica de cálculo individual dos motoristas
-- para o frete do dia 30/07/2025

-- 1. Encontrar o frete específico
SELECT 
    f.id as frete_id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.valor_frete as valor_total_frete
FROM fretes f
WHERE f.data_emissao = '2025-07-30'
    AND f.origem ILIKE '%AGROCENTRO%'
    AND f.destino ILIKE '%FAZ ESPINHAÇO%';

-- 2. Verificar todos os motoristas deste frete
SELECT 
    f.id as frete_id,
    f.valor_frete as valor_total_frete,
    m.nome as motorista_nome,
    m.id as motorista_id,
    COUNT(*) OVER (PARTITION BY f.id) as total_motoristas_frete,
    f.valor_frete / COUNT(*) OVER (PARTITION BY f.id) as valor_individual_calculado
FROM fretes f
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE f.data_emissao = '2025-07-30'
    AND f.origem ILIKE '%AGROCENTRO%'
    AND f.destino ILIKE '%FAZ ESPINHAÇO%'
ORDER BY m.nome;

-- 3. Verificar especificamente o motorista Fabiano
SELECT 
    f.id as frete_id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.valor_frete as valor_total_frete,
    m.nome as motorista_nome,
    m.id as motorista_id,
    COUNT(*) OVER (PARTITION BY f.id) as total_motoristas_frete,
    f.valor_frete / COUNT(*) OVER (PARTITION BY f.id) as valor_individual_fabiano
FROM fretes f
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE f.data_emissao = '2025-07-30'
    AND f.origem ILIKE '%AGROCENTRO%'
    AND f.destino ILIKE '%FAZ ESPINHAÇO%'
    AND m.nome ILIKE '%Fabiano Alexandre de Oliveira%';

-- 4. Verificar se há outros fretes do Fabiano em julho/2025
SELECT 
    f.id as frete_id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.valor_frete as valor_total_frete,
    m.nome as motorista_nome,
    COUNT(*) OVER (PARTITION BY f.id) as total_motoristas_frete,
    f.valor_frete / COUNT(*) OVER (PARTITION BY f.id) as valor_individual_fabiano
FROM fretes f
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE f.data_emissao >= '2025-07-01'
    AND f.data_emissao <= '2025-07-31'
    AND m.nome ILIKE '%Fabiano Alexandre de Oliveira%'
ORDER BY f.data_emissao DESC;

-- 5. Resumo total do Fabiano em julho/2025
SELECT 
    m.nome as motorista_nome,
    COUNT(DISTINCT f.id) as total_fretes,
    SUM(f.valor_frete / COUNT(*) OVER (PARTITION BY f.id)) as valor_total_individual
FROM fretes f
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE f.data_emissao >= '2025-07-01'
    AND f.data_emissao <= '2025-07-31'
    AND m.nome ILIKE '%Fabiano Alexandre de Oliveira%'
GROUP BY m.nome; 