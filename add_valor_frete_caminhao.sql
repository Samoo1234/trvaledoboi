-- Adicionar campo valor_frete na tabela frete_caminhao
-- Este campo armazenará o valor individual de cada caminhão no frete

ALTER TABLE frete_caminhao ADD COLUMN valor_frete DECIMAL(10,2);

-- Comentário explicativo
COMMENT ON COLUMN frete_caminhao.valor_frete IS 'Valor individual do frete para este caminhão específico';

-- Verificar se a alteração foi aplicada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'frete_caminhao' AND column_name = 'valor_frete'; 