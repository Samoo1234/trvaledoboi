-- Criar tabela para manutenções de caminhões
CREATE TABLE IF NOT EXISTS manutencoes_caminhoes (
    id SERIAL PRIMARY KEY,
    caminhao_id INTEGER NOT NULL REFERENCES caminhoes(id) ON DELETE CASCADE,
    data_manutencao DATE NOT NULL,
    tipo_manutencao VARCHAR(20) NOT NULL DEFAULT 'Corretiva', -- Preventiva, Corretiva, Emergencial
    descricao_servico TEXT NOT NULL,
    valor_servico DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    oficina_responsavel VARCHAR(255),
    km_caminhao INTEGER,
    observacoes TEXT,
    periodo VARCHAR(7) NOT NULL, -- MM/YYYY para relatórios
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_manutencoes_caminhao ON manutencoes_caminhoes(caminhao_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_data ON manutencoes_caminhoes(data_manutencao);
CREATE INDEX IF NOT EXISTS idx_manutencoes_periodo ON manutencoes_caminhoes(periodo);
CREATE INDEX IF NOT EXISTS idx_manutencoes_tipo ON manutencoes_caminhoes(tipo_manutencao);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_manutencoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_manutencoes_updated_at
    BEFORE UPDATE ON manutencoes_caminhoes
    FOR EACH ROW
    EXECUTE FUNCTION update_manutencoes_updated_at();

-- Função para extrair período automaticamente
CREATE OR REPLACE FUNCTION extract_periodo_manutencao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.periodo = TO_CHAR(NEW.data_manutencao, 'MM/YYYY');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_extract_periodo_manutencao
    BEFORE INSERT OR UPDATE ON manutencoes_caminhoes
    FOR EACH ROW
    EXECUTE FUNCTION extract_periodo_manutencao();

-- Comentários na tabela
COMMENT ON TABLE manutencoes_caminhoes IS 'Registro de manutenções realizadas nos caminhões';
COMMENT ON COLUMN manutencoes_caminhoes.tipo_manutencao IS 'Tipo: Preventiva, Corretiva, Emergencial';
COMMENT ON COLUMN manutencoes_caminhoes.periodo IS 'Período MM/YYYY para relatórios e filtros';
COMMENT ON COLUMN manutencoes_caminhoes.km_caminhao IS 'Quilometragem do caminhão na data da manutenção'; 