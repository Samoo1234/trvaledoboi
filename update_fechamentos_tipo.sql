-- Script para verificar e atualizar referências em outras tabelas
-- Execute após atualizar a tabela motoristas

-- Verificar se há tabelas relacionadas que precisam ser atualizadas
-- (geralmente as foreign keys mantêm a consistência automaticamente)

-- Se houver dados desnormalizados em fechamentos_motoristas, atualize aqui:
-- UPDATE fechamentos_motoristas 
-- SET algum_campo_tipo = 'Funcionário' 
-- WHERE algum_campo_tipo = 'Próprio';

-- Verificar dados atuais na tabela motoristas
SELECT 
    tipo_motorista, 
    COUNT(*) as quantidade 
FROM motoristas 
GROUP BY tipo_motorista;

-- Verificar fechamentos recentes para confirmar os dados
SELECT 
    f.id,
    f.periodo,
    m.nome,
    m.tipo_motorista
FROM fechamentos_motoristas f
JOIN motoristas m ON f.motorista_id = m.id
ORDER BY f.created_at DESC
LIMIT 10; 