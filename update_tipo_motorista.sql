-- Script para atualizar tipo de motorista de 'Próprio' para 'Funcionário'
-- Execute este script no Supabase para atualizar os dados existentes

UPDATE motoristas 
SET tipo_motorista = 'Funcionário' 
WHERE tipo_motorista = 'Próprio';

-- Verificar quantos registros foram atualizados
SELECT COUNT(*) as registros_atualizados 
FROM motoristas 
WHERE tipo_motorista = 'Funcionário';

-- Verificar se ainda há registros com 'Próprio'
SELECT COUNT(*) as registros_antigos 
FROM motoristas 
WHERE tipo_motorista = 'Próprio'; 