-- ===================================================
-- Adicionar campo preco_por_litro na tabela abastecimentos
-- ===================================================
-- Data: 19/11/2024
-- Descrição: Campo para armazenar o preço unitário do combustível
--            Permitirá cálculo automático do preço total

-- Adicionar coluna preco_por_litro
ALTER TABLE abastecimentos 
ADD COLUMN IF NOT EXISTS preco_por_litro NUMERIC(10,2);

-- Comentário explicativo
COMMENT ON COLUMN abastecimentos.preco_por_litro IS 'Preço unitário por litro de combustível (R$/L)';

-- Calcular e preencher preco_por_litro para registros existentes
-- (onde preco_total já existe)
UPDATE abastecimentos 
SET preco_por_litro = ROUND(preco_total / NULLIF(quantidade_litros, 0), 2)
WHERE preco_total IS NOT NULL 
  AND quantidade_litros > 0 
  AND preco_por_litro IS NULL;

-- Verificar resultado
SELECT 
  id,
  data_abastecimento,
  quantidade_litros,
  preco_por_litro,
  preco_total,
  ROUND(quantidade_litros * preco_por_litro, 2) as preco_recalculado
FROM abastecimentos
WHERE preco_total IS NOT NULL
ORDER BY data_abastecimento DESC
LIMIT 10;

-- ===================================================
-- INSTRUÇÕES:
-- ===================================================
-- 1. Execute este script no Supabase SQL Editor
-- 2. Verifique se os valores foram calculados corretamente
-- 3. Continue com a atualização do frontend
-- ===================================================

