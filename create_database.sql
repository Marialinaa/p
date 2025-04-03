-- Criar o banco de dados tankBdM
CREATE DATABASE IF NOT EXISTS tankBdM CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar o banco de dados
USE tankBdM;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de posts do blog
CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Inserir um usuário administrador inicial
INSERT INTO users (name, email, password) 
VALUES ('Administrador', 'admin@exemplo.com', '$2a$12$1rCLm9FHRYl0X1MJNkR/uOd6RvO7ha7hdgSCy.Ia6Qed8gd9Ieiya'); -- senha: admin123 (hashed)
