-- Script para alterar tabela fretes: substituir numero_cte por numero_cb
-- Executar no Supabase SQL Editor

-- 1. Adicionar nova coluna numero_cb
ALTER TABLE fretes ADD COLUMN numero_cb VARCHAR(255);

-- 2. Copiar dados existentes de numero_cte para numero_cb (se houver dados)
UPDATE fretes SET numero_cb = numero_cte WHERE numero_cte IS NOT NULL;

-- 3. Remover coluna numero_cte (após confirmar que os dados foram copiados)
ALTER TABLE fretes DROP COLUMN numero_cte;

-- 4. Adicionar comentário explicativo
COMMENT ON COLUMN fretes.numero_cb IS 'Número do Conhecimento de Bordo (CB)';

-- Verificar resultado
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fretes' 
AND column_name IN ('numero_cb', 'numero_cte')
ORDER BY column_name; 