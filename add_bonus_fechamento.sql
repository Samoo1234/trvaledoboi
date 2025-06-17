-- Adicionar campo bonus na tabela fechamentos_motoristas
ALTER TABLE fechamentos_motoristas 
ADD COLUMN bonus DECIMAL(10,2) DEFAULT 0;

-- Comentário explicativo
COMMENT ON COLUMN fechamentos_motoristas.bonus IS 'Valor de bônus adicional concedido ao motorista';

-- Atualizar registros existentes para ter bonus = 0
UPDATE fechamentos_motoristas 
SET bonus = 0 
WHERE bonus IS NULL; 