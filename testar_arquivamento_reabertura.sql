-- Script para testar o processo completo de arquivamento e reabertura
-- Execute no SQL Editor do Supabase para verificar se está tudo funcionando

-- 1. Verificar estado inicial das tabelas
SELECT 'Fretes ativos' as tipo, COUNT(*) as quantidade FROM fretes
UNION ALL
SELECT 'Fretes arquivados' as tipo, COUNT(*) as quantidade FROM fretes_historico
UNION ALL
SELECT 'Fechamentos ativos' as tipo, COUNT(*) as quantidade FROM fechamentos_motoristas
UNION ALL
SELECT 'Fechamentos arquivados' as tipo, COUNT(*) as quantidade FROM fechamentos_motoristas_historico;

-- 2. Verificar registros específicos na tabela de histórico
SELECT 
    'Registro de maio 2025' as info,
    id as historico_id,
    frete_id as id_original,
    data_emissao,
    origem,
    destino,
    arquivado_em
FROM fretes_historico 
WHERE data_emissao = '2025-05-26';

-- 3. Verificar se os JOINs funcionam corretamente no histórico
SELECT 
    fh.id as historico_id,
    fh.frete_id,
    fh.data_emissao,
    fh.origem,
    fh.destino,
    c.placa as caminhao_placa,
    m.nome as motorista_nome,
    fh.arquivado_em
FROM fretes_historico fh
LEFT JOIN caminhoes c ON fh.caminhao_id = c.id
LEFT JOIN motoristas m ON fh.motorista_id = m.id
ORDER BY fh.arquivado_em DESC
LIMIT 5;

-- 4. Simular consulta sem filtros (como o frontend faz agora)
-- Esta é a query equivalente ao freteService.getArquivados({})
SELECT 
    fh.*,
    c.placa,
    c.tipo,
    m.nome
FROM fretes_historico fh
LEFT JOIN caminhoes c ON fh.caminhao_id = c.id
LEFT JOIN motoristas m ON fh.motorista_id = m.id
ORDER BY fh.data_emissao DESC;

-- 5. Verificar campos obrigatórios para reabertura
SELECT 
    frete_id,
    CASE 
        WHEN frete_id IS NULL THEN '❌ ERRO: frete_id é NULL'
        ELSE '✅ OK: frete_id válido'
    END as status_frete_id,
    CASE 
        WHEN arquivado_em IS NULL THEN '❌ ERRO: arquivado_em é NULL'
        ELSE '✅ OK: arquivado_em válido'
    END as status_arquivado_em
FROM fretes_historico; 