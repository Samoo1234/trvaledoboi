-- Tabela de histórico de fretes
CREATE TABLE IF NOT EXISTS fretes_historico (
  id SERIAL PRIMARY KEY,
  frete_id INTEGER NOT NULL, -- ID do frete original
  data_emissao DATE NOT NULL,
  pecuarista VARCHAR(255),
  origem VARCHAR(255),
  destino VARCHAR(255),
  numero_minuta VARCHAR(100),
  numero_cb VARCHAR(100),
  cliente VARCHAR(255),
  observacoes TEXT,
  caminhao_id INTEGER,
  motorista_id INTEGER,
  faixa VARCHAR(100),
  total_km DECIMAL(10,2),
  valor_frete DECIMAL(10,2) NOT NULL,
  saldo_receber DECIMAL(10,2),
  situacao VARCHAR(50) NOT NULL,
  tipo_pagamento VARCHAR(50),
  data_pagamento DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  arquivado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  arquivado_por VARCHAR(255),
  
  -- Chaves estrangeiras
  FOREIGN KEY (caminhao_id) REFERENCES caminhoes(id),
  FOREIGN KEY (motorista_id) REFERENCES motoristas(id)
);

-- Tabela de histórico de fechamentos
CREATE TABLE IF NOT EXISTS fechamentos_motoristas_historico (
  id SERIAL PRIMARY KEY,
  fechamento_id INTEGER NOT NULL, -- ID do fechamento original
  motorista_id INTEGER NOT NULL,
  periodo VARCHAR(7) NOT NULL, -- MM/YYYY
  data_fechamento DATE,
  total_fretes INTEGER DEFAULT 0,
  valor_bruto DECIMAL(10,2) DEFAULT 0.00,
  valor_comissao DECIMAL(10,2) DEFAULT 0.00,
  descontos DECIMAL(10,2) DEFAULT 0.00,
  bonus DECIMAL(10,2) DEFAULT 0.00,
  valor_liquido DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(50) NOT NULL DEFAULT 'Pendente',
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  arquivado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  arquivado_por VARCHAR(255),
  
  -- Chave estrangeira
  FOREIGN KEY (motorista_id) REFERENCES motoristas(id)
);

-- Índices para melhorar performance das consultas
CREATE INDEX idx_fretes_historico_data_emissao ON fretes_historico(data_emissao);
CREATE INDEX idx_fretes_historico_motorista_id ON fretes_historico(motorista_id);
CREATE INDEX idx_fretes_historico_cliente ON fretes_historico(cliente);
CREATE INDEX idx_fretes_historico_tipo_pagamento ON fretes_historico(tipo_pagamento);
CREATE INDEX idx_fretes_historico_frete_id ON fretes_historico(frete_id);

CREATE INDEX idx_fechamentos_historico_motorista_id ON fechamentos_motoristas_historico(motorista_id);
CREATE INDEX idx_fechamentos_historico_periodo ON fechamentos_motoristas_historico(periodo);
CREATE INDEX idx_fechamentos_historico_data_fechamento ON fechamentos_motoristas_historico(data_fechamento);
CREATE INDEX idx_fechamentos_historico_status ON fechamentos_motoristas_historico(status);
CREATE INDEX idx_fechamentos_historico_fechamento_id ON fechamentos_motoristas_historico(fechamento_id);

-- Função para atualizar o timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_fretes_historico_updated_at
    BEFORE UPDATE ON fretes_historico
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fechamentos_historico_updated_at
    BEFORE UPDATE ON fechamentos_motoristas_historico
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários das tabelas
COMMENT ON TABLE fretes_historico IS 'Tabela de histórico para fretes arquivados';
COMMENT ON COLUMN fretes_historico.frete_id IS 'ID do frete original na tabela fretes';
COMMENT ON COLUMN fretes_historico.arquivado_em IS 'Timestamp de quando o frete foi arquivado';
COMMENT ON COLUMN fretes_historico.arquivado_por IS 'Usuário que arquivou o frete';

COMMENT ON TABLE fechamentos_motoristas_historico IS 'Tabela de histórico para fechamentos arquivados';
COMMENT ON COLUMN fechamentos_motoristas_historico.fechamento_id IS 'ID do fechamento original na tabela fechamentos_motoristas';
COMMENT ON COLUMN fechamentos_motoristas_historico.arquivado_em IS 'Timestamp de quando o fechamento foi arquivado';
COMMENT ON COLUMN fechamentos_motoristas_historico.arquivado_por IS 'Usuário que arquivou o fechamento'; 