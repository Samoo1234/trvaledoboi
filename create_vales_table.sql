-- Script para criar tabela de vales dos motoristas
-- Execute no Supabase para criar a nova estrutura

-- Criar tabela para registrar vales dos motoristas
CREATE TABLE IF NOT EXISTS vales_motoristas (
  id BIGSERIAL PRIMARY KEY,
  motorista_id BIGINT NOT NULL REFERENCES motoristas(id) ON DELETE CASCADE,
  data_vale DATE NOT NULL,
  valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
  descricao TEXT,
  periodo VARCHAR(7) NOT NULL, -- Formato MM/YYYY
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_vales_motoristas_motorista_id ON vales_motoristas(motorista_id);
CREATE INDEX IF NOT EXISTS idx_vales_motoristas_periodo ON vales_motoristas(periodo);
CREATE INDEX IF NOT EXISTS idx_vales_motoristas_data ON vales_motoristas(data_vale);

-- Adicionar comentários para documentação
COMMENT ON TABLE vales_motoristas IS 'Registro de vales/adiantamentos concedidos aos motoristas';
COMMENT ON COLUMN vales_motoristas.periodo IS 'Período do vale no formato MM/YYYY para facilitar agrupamento';
COMMENT ON COLUMN vales_motoristas.valor IS 'Valor do vale em reais, sempre positivo';

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_vales_motoristas_updated_at ON vales_motoristas;
CREATE TRIGGER update_vales_motoristas_updated_at
    BEFORE UPDATE ON vales_motoristas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 