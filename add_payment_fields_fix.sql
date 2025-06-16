-- Adicionar apenas os novos campos de pagamento na tabela fretes
-- (situacao já existe, vamos adicionar apenas tipo_pagamento e data_pagamento)

ALTER TABLE fretes 
ADD COLUMN tipo_pagamento VARCHAR(20),
ADD COLUMN data_pagamento DATE;

-- Comentários para documentação
COMMENT ON COLUMN fretes.tipo_pagamento IS 'Tipo de pagamento: PIX, Dinheiro, Cheque ou TED';
COMMENT ON COLUMN fretes.data_pagamento IS 'Data em que o pagamento foi efetuado'; 