-- ==========================================
-- MIGRAÇÃO: Adicionar cliente_id à tabela fretes
-- Executar no Supabase Dashboard > SQL Editor
-- ==========================================

-- PASSO 1: Adicionar coluna cliente_id como FK para tabela clientes
ALTER TABLE fretes ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id);

-- PASSO 2: Vincular fretes existentes aos clientes pelo nome (quando possível)
-- Isso preenche cliente_id para todos os fretes que têm um cliente com nome correspondente
UPDATE fretes f
SET cliente_id = c.id
FROM clientes c
WHERE LOWER(TRIM(f.cliente)) = LOWER(TRIM(c.razao_social))
  AND f.cliente IS NOT NULL
  AND f.cliente != ''
  AND f.cliente_id IS NULL;

-- PASSO 3: Criar índice para performance nas queries com join
CREATE INDEX IF NOT EXISTS idx_fretes_cliente_id ON fretes(cliente_id);

-- VERIFICAÇÃO: Ver quantos fretes foram vinculados e quantos ficaram pendentes
SELECT 
  COUNT(*) as total_fretes,
  COUNT(cliente_id) as vinculados,
  COUNT(*) - COUNT(cliente_id) as pendentes,
  ROUND(COUNT(cliente_id)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as percentual_vinculado
FROM fretes
WHERE cliente IS NOT NULL AND cliente != '';
