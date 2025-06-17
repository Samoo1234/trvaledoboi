-- Script para adicionar campo de comissão personalizada aos motoristas
-- Execute no Supabase após criar a tabela de vales

-- Adicionar campo para comissão personalizada
ALTER TABLE motoristas 
ADD COLUMN IF NOT EXISTS porcentagem_comissao DECIMAL(5,2) CHECK (porcentagem_comissao > 0 AND porcentagem_comissao <= 100);

-- Adicionar comentário para documentação
COMMENT ON COLUMN motoristas.porcentagem_comissao IS 'Porcentagem de comissão personalizada para o motorista. Se NULL, usa o padrão do tipo (10% funcionário, 90% terceiro)';

-- Atualizar motoristas funcionários existentes para usar a porcentagem padrão diferenciada (opcional)
-- Descomente a linha abaixo se quiser definir 11% para algum motorista específico
-- UPDATE motoristas SET porcentagem_comissao = 11.0 WHERE tipo_motorista = 'Funcionário' AND nome = 'NOME_DO_MOTORISTA';

-- Verificar estrutura atualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'motoristas' 
AND column_name IN ('porcentagem_comissao', 'tipo_motorista', 'nome')
ORDER BY ordinal_position; 