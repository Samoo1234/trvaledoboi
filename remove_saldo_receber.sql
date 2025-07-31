-- Remover coluna saldo_receber da tabela fretes
ALTER TABLE fretes DROP COLUMN IF EXISTS saldo_receber;

-- Verificar se a coluna foi removida
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'fretes' 
ORDER BY column_name; 