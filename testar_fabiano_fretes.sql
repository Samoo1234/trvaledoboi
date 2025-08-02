-- Testar se os fretes do Fabiano estão sendo encontrados corretamente
-- após as correções no sistema

-- 1. Verificar se o motorista Fabiano existe
SELECT 
    id,
    nome,
    tipo_motorista,
    status
FROM motoristas 
WHERE nome ILIKE '%Fabiano Alexandre de Oliveira%';

-- 2. Verificar fretes do Fabiano após 20/07/2025 usando a tabela de relacionamento
SELECT 
    f.id as frete_id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.valor_frete,
    f.situacao,
    m.nome as motorista_nome,
    m.id as motorista_id
FROM fretes f
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE m.nome ILIKE '%Fabiano Alexandre de Oliveira%'
    AND f.data_emissao > '2025-07-20'
ORDER BY f.data_emissao DESC;

-- 3. Verificar se há fretes do Fabiano em julho/2025 (período 07/2025)
SELECT 
    f.id as frete_id,
    f.data_emissao,
    f.origem,
    f.destino,
    f.valor_frete,
    f.situacao,
    m.nome as motorista_nome,
    m.id as motorista_id
FROM fretes f
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE m.nome ILIKE '%Fabiano Alexandre de Oliveira%'
    AND f.data_emissao >= '2025-07-01'
    AND f.data_emissao <= '2025-07-31'
ORDER BY f.data_emissao DESC;

-- 4. Verificar total de fretes do Fabiano em julho/2025
SELECT 
    m.nome as motorista_nome,
    COUNT(*) as total_fretes,
    SUM(f.valor_frete) as valor_total
FROM fretes f
JOIN frete_motorista fm ON f.id = fm.frete_id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE m.nome ILIKE '%Fabiano Alexandre de Oliveira%'
    AND f.data_emissao >= '2025-07-01'
    AND f.data_emissao <= '2025-07-31'
GROUP BY m.nome;

-- 5. Verificar se há vínculos na tabela frete_motorista para o Fabiano
SELECT 
    fm.id,
    fm.frete_id,
    fm.motorista_id,
    f.data_emissao,
    m.nome as motorista_nome
FROM frete_motorista fm
JOIN fretes f ON fm.frete_id = f.id
JOIN motoristas m ON fm.motorista_id = m.id
WHERE m.nome ILIKE '%Fabiano Alexandre de Oliveira%'
    AND f.data_emissao > '2025-07-20'
ORDER BY f.data_emissao DESC; 