-- Extensão para gerar hash de senhas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função para autenticar usuário
CREATE OR REPLACE FUNCTION authenticate_user(
    p_email TEXT,
    p_senha TEXT
)
RETURNS TABLE (
    id INTEGER,
    email VARCHAR(255),
    nome VARCHAR(255),
    tipo_usuario VARCHAR(50),
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.nome,
        u.tipo_usuario,
        u.status,
        u.created_at,
        u.updated_at
    FROM usuarios u
    WHERE u.email = p_email 
      AND u.senha_hash = crypt(p_senha, u.senha_hash)
      AND u.status = 'Ativo';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar usuário com hash de senha
CREATE OR REPLACE FUNCTION create_user_with_hash(
    p_email TEXT,
    p_nome TEXT,
    p_senha TEXT,
    p_tipo_usuario VARCHAR(50) DEFAULT 'Operador',
    p_status VARCHAR(20) DEFAULT 'Ativo'
)
RETURNS TABLE (
    id INTEGER,
    email VARCHAR(255),
    nome VARCHAR(255),
    tipo_usuario VARCHAR(50),
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    new_user_id INTEGER;
BEGIN
    -- Verificar se email já existe
    IF EXISTS (SELECT 1 FROM usuarios WHERE usuarios.email = p_email) THEN
        RAISE EXCEPTION 'Email já está em uso por outro usuário';
    END IF;
    
    -- Inserir novo usuário
    INSERT INTO usuarios (email, nome, senha_hash, tipo_usuario, status)
    VALUES (
        p_email,
        p_nome,
        crypt(p_senha, gen_salt('bf')),
        p_tipo_usuario,
        p_status
    )
    RETURNING usuarios.id INTO new_user_id;
    
    -- Retornar dados do usuário criado
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.nome,
        u.tipo_usuario,
        u.status,
        u.created_at,
        u.updated_at
    FROM usuarios u
    WHERE u.id = new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para alterar senha do usuário
CREATE OR REPLACE FUNCTION change_user_password(
    p_user_id INTEGER,
    p_nova_senha TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Verificar se usuário existe
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    -- Atualizar senha
    UPDATE usuarios 
    SET senha_hash = crypt(p_nova_senha, gen_salt('bf')),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é o primeiro acesso (criar admin padrão)
CREATE OR REPLACE FUNCTION ensure_default_admin()
RETURNS VOID AS $$
BEGIN
    -- Se não há usuários, criar admin padrão
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE tipo_usuario = 'Admin') THEN
        INSERT INTO usuarios (email, nome, senha_hash, tipo_usuario, status)
        VALUES (
            'admin@valedoboi.com.br',
            'Administrador',
            crypt('admin123', gen_salt('bf')),
            'Admin',
            'Ativo'
        )
        ON CONFLICT (email) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar a função para garantir que existe um admin
SELECT ensure_default_admin();

-- Comentários sobre as funções
COMMENT ON FUNCTION authenticate_user IS 'Autentica usuário verificando email e senha';
COMMENT ON FUNCTION create_user_with_hash IS 'Cria novo usuário com senha hasheada';
COMMENT ON FUNCTION change_user_password IS 'Altera senha de usuário existente';
COMMENT ON FUNCTION ensure_default_admin IS 'Garante que existe pelo menos um usuário admin'; 