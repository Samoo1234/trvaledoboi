-- Verificar fretes do cliente BARRA ALIMENTOS

-- 1. Ver se existem fretes arquivados
SELECT 
  COUNT(*) as total_arquivados,
  MIN(data_emissao) as primeira_data,
  MAX(data_emissao) as ultima_data
FROM fretes 
WHERE cliente = 'BARRA ALIMENTOS'
AND arquivado = true;

-- 2. Ver se existem fretes ativos
SELECT 
  COUNT(*) as total_ativos,
  MIN(data_emissao) as primeira_data,
  MAX(data_emissao) as ultima_data
FROM fretes 
WHERE cliente = 'BARRA ALIMENTOS'
AND (arquivado = false OR arquivado IS NULL);

-- 3. Ver todos os fretes deste cliente
SELECT 
  id,
  numero_minuta,
  data_emissao,
  situacao,
  valor_frete,
  arquivado,
  arquivado_em
FROM fretes 
WHERE cliente = 'BARRA ALIMENTOS'
ORDER BY data_emissao DESC;

