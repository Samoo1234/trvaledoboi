-- Adicionar campos de pagamento na tabela fretes
ALTER TABLE fretes 
ADD COLUMN situacao VARCHAR(20) DEFAULT 'Pendente',
ADD COLUMN tipo_pagamento VARCHAR(20),
ADD COLUMN data_pagamento DATE;

-- Comentários para documentação
COMMENT ON COLUMN fretes.situacao IS 'Situação do frete: Pendente ou Pago';
COMMENT ON COLUMN fretes.tipo_pagamento IS 'Tipo de pagamento: PIX, Dinheiro, Cheque ou TED';
COMMENT ON COLUMN fretes.data_pagamento IS 'Data em que o pagamento foi efetuado'; 