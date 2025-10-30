-- Adicionar campo 'arquivado' na tabela fretes
-- Abordagem mais segura: não deletar, apenas marcar como arquivado

ALTER TABLE fretes 
ADD COLUMN IF NOT EXISTS arquivado BOOLEAN DEFAULT FALSE;

ALTER TABLE fretes 
ADD COLUMN IF NOT EXISTS arquivado_em TIMESTAMP;

ALTER TABLE fretes 
ADD COLUMN IF NOT EXISTS arquivado_por VARCHAR(255);

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_fretes_arquivado ON fretes(arquivado);

-- Comentários
COMMENT ON COLUMN fretes.arquivado IS 'Indica se o frete foi arquivado (true) ou está ativo (false)';
COMMENT ON COLUMN fretes.arquivado_em IS 'Data e hora que o frete foi arquivado';
COMMENT ON COLUMN fretes.arquivado_por IS 'Usuário que arquivou o frete';

-- Verificar a alteração
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'fretes' 
AND column_name IN ('arquivado', 'arquivado_em', 'arquivado_por');

