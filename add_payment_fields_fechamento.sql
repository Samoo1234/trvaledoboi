-- Script para adicionar campos de pagamento na tabela fechamentos_motoristas
-- Execute no Supabase se desejar controlar pagamentos individuais de fechamentos

ALTER TABLE fechamentos_motoristas 
ADD COLUMN IF NOT EXISTS tipo_pagamento VARCHAR(20),
ADD COLUMN IF NOT EXISTS data_pagamento DATE;

-- Comentários para documentação
COMMENT ON COLUMN fechamentos_motoristas.tipo_pagamento IS 'Tipo de pagamento: PIX, Dinheiro, Cheque ou TED';
COMMENT ON COLUMN fechamentos_motoristas.data_pagamento IS 'Data em que o pagamento foi efetuado';

-- Verificar estrutura atualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fechamentos_motoristas' 
AND column_name IN ('tipo_pagamento', 'data_pagamento', 'status')
ORDER BY ordinal_position; 