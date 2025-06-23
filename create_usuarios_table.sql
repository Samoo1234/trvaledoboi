-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(50) NOT NULL DEFAULT 'Operador' CHECK (tipo_usuario IN ('Admin', 'Operador')),
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário admin padrão (senha: admin123)
-- Hash gerado para 'admin123' usando bcrypt
INSERT INTO usuarios (email, nome, senha_hash, tipo_usuario, status) 
VALUES (
    'admin@valedoboi.com.br', 
    'Administrador', 
    '$2b$10$7Zb4RzPQVgKO1mPMJGEgPuYTKxF0.pVQVOKjQA7/pPmqCT9gSJE.2', 
    'Admin', 
    'Ativo'
) 
ON CONFLICT (email) DO NOTHING;

-- Comentários explicativos
COMMENT ON TABLE usuarios IS 'Tabela para controle de acesso ao sistema';
COMMENT ON COLUMN usuarios.tipo_usuario IS 'Admin: acesso total, Operador: acesso limitado';
COMMENT ON COLUMN usuarios.status IS 'Ativo: pode fazer login, Inativo: bloqueado'; 