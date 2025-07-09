-- Script para verificar dados na tabela fretes_historico
-- Execute este script no SQL Editor do Supabase para diagnosticar problemas

-- 1. Verificar se a tabela existe e quantos registros tem
SELECT 
    'fretes_historico' as tabela,
    COUNT(*) as total_registros
FROM fretes_historico;

-- 2. Mostrar todos os registros com informações básicas
SELECT 
    id,
    frete_id,
    data_emissao,
    pecuarista,
    origem,
    destino,
    valor_frete,
    arquivado_em,
    caminhao_id,
    motorista_id
FROM fretes_historico
ORDER BY arquivado_em DESC;

-- 3. Verificar se há joins funcionando corretamente
SELECT 
    fh.id,
    fh.frete_id,
    fh.data_emissao,
    fh.origem,
    fh.destino,
    fh.valor_frete,
    c.placa as caminhao_placa,
    c.tipo as caminhao_tipo,
    m.nome as motorista_nome
FROM fretes_historico fh
LEFT JOIN caminhoes c ON fh.caminhao_id = c.id
LEFT JOIN motoristas m ON fh.motorista_id = m.id
ORDER BY fh.arquivado_em DESC;

-- 4. Verificar registros em diferentes períodos
SELECT 
    'Registros de maio 2025' as periodo,
    COUNT(*) as quantidade
FROM fretes_historico 
WHERE data_emissao >= '2025-05-01' AND data_emissao <= '2025-05-31'

UNION ALL

SELECT 
    'Registros de julho 2025' as periodo,
    COUNT(*) as quantidade
FROM fretes_historico 
WHERE data_emissao >= '2025-07-01' AND data_emissao <= '2025-07-31'

UNION ALL

SELECT 
    'Todos os registros' as periodo,
    COUNT(*) as quantidade
FROM fretes_historico;

-- 5. Verificar se RLS está afetando as consultas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'fretes_historico';

-- 6. Verificar políticas RLS (se existirem)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'fretes_historico'; 