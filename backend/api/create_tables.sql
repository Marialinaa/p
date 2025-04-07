-- Atualização da tabela de usuários para suportar gerenciamento de sessões

-- Verificar se a tabela já tem a coluna ultimo_login
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_login DATETIME NULL;

-- Verificar se a tabela já tem a coluna token para rastreamento de sessão
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token VARCHAR(255) NULL;

-- Verificar se a tabela já tem a coluna ip_address para informações de login
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NULL;

-- Verificar se a tabela já tem a coluna user_agent para informações de navegador
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS user_agent VARCHAR(255) NULL;

-- Criar índice para melhorar consultas de usuários logados
CREATE INDEX IF NOT EXISTS idx_usuarios_login ON usuarios (ultimo_login);

-- Criar tabela de logs de autenticação, se não existir
CREATE TABLE IF NOT EXISTS auth_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    email VARCHAR(100) NULL,
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    status ENUM('success', 'failure') NOT NULL DEFAULT 'success',
    details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Criar tabela de sessões de usuários
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
