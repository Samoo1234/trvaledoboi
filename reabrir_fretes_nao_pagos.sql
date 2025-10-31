-- Script para reabrir fretes arquivados que NÃO estão pagos
-- Execute este script APENAS UMA VEZ no banco de dados

-- Verificar quantos fretes serão reabertos
SELECT COUNT(*) as total_fretes_para_reabrir
FROM fretes 
WHERE arquivado = true 
AND situacao != 'Pago';

-- Mostrar os fretes que serão reabertos (para conferir)
SELECT id, numero_minuta, cliente, situacao, data_emissao, arquivado_em
FROM fretes 
WHERE arquivado = true 
AND situacao != 'Pago'
ORDER BY data_emissao DESC;

-- Reabrir os fretes que NÃO estão pagos
UPDATE fretes 
SET 
  arquivado = false,
  arquivado_em = NULL,
  arquivado_por = NULL
WHERE arquivado = true 
AND situacao != 'Pago';

-- Verificar o resultado
SELECT 
  COUNT(*) as total_ativos,
  COUNT(*) FILTER (WHERE arquivado = true) as total_arquivados,
  COUNT(*) FILTER (WHERE arquivado = false OR arquivado IS NULL) as total_nao_arquivados
FROM fretes;

-- Confirmar que apenas fretes PAGOS estão arquivados
SELECT situacao, COUNT(*) as quantidade
FROM fretes 
WHERE arquivado = true
GROUP BY situacao;

