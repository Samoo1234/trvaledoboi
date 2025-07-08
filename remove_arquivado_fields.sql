-- Remover campo 'arquivado' das tabelas originais
-- Agora que temos tabelas de histórico separadas, não precisamos mais deste campo

-- Remover campo arquivado da tabela fretes
ALTER TABLE fretes DROP COLUMN IF EXISTS arquivado;

-- Remover campo arquivado da tabela fechamentos_motoristas
ALTER TABLE fechamentos_motoristas DROP COLUMN IF EXISTS arquivado;

-- Mensagem de confirmação
SELECT 'Campos arquivado removidos com sucesso das tabelas fretes e fechamentos_motoristas' as resultado; 