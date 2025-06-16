-- Corrigir motoristas sem status definido
UPDATE motoristas 
SET status = 'Ativo' 
WHERE status IS NULL; 