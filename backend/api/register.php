<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Tratar solicitações OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar se é uma requisição POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Apenas requisições POST são permitidas']);
    exit;
}

// Obter os dados enviados
$dados = json_decode(file_get_contents("php://input"), true);

// Verificar se os dados necessários foram fornecidos
if (!isset($dados['name']) || !isset($dados['email']) || !isset($dados['password'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Dados incompletos. Nome, email e senha são obrigatórios.']);
    exit;
}

// Sanitizar e validar os dados
$nome = filter_var($dados['name'], FILTER_SANITIZE_STRING);
$email = filter_var($dados['email'], FILTER_SANITIZE_EMAIL);
$senha = $dados['password'];

// Definir tipo baseado no email - admin@admin.com recebe "admin123", demais "user"
$tipo = ($email === 'admin@admin.com') ? 'admin123' : 'user';

// Validação adicional
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email inválido']);
    exit;
}

// Conexão com o banco de dados
try {
    require_once 'conexao.php';
    
    // Verificar se o email já existe
    $stmt = $mysqli->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        http_response_code(409); // Conflict
        echo json_encode(['error' => 'Este email já está cadastrado. Por favor, use outro email.']);
        exit;
    }
    
    // Criar hash da senha
    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    
    // Obter a estrutura da tabela para verificar as colunas existentes
    $tableInfo = $mysqli->query("DESCRIBE usuarios");
    $colunas = [];
    while ($row = $tableInfo->fetch_assoc()) {
        $colunas[] = $row['Field'];
    }
    
    // Determinar quais campos usar e montar a consulta SQL adequada
    if (in_array('created_at', $colunas) && in_array('tipo', $colunas)) {
        // Se a tabela tiver as colunas 'created_at' e 'tipo'
        $stmt = $mysqli->prepare("INSERT INTO usuarios (nome, email, senha, tipo, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->bind_param("ssss", $nome, $email, $senhaHash, $tipo);
    } elseif (in_array('tipo', $colunas)) {
        // Se tiver apenas a coluna 'tipo'
        $stmt = $mysqli->prepare("INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $nome, $email, $senhaHash, $tipo);
    } elseif (in_array('created_at', $colunas)) {
        // Se tiver apenas a coluna 'created_at'
        $stmt = $mysqli->prepare("INSERT INTO usuarios (nome, email, senha, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->bind_param("sss", $nome, $email, $senhaHash);
    } else {
        // Se não tiver as colunas, usar estrutura básica
        $stmt = $mysqli->prepare("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $nome, $email, $senhaHash);
    }
    
    if ($stmt->execute()) {
        $userId = $mysqli->insert_id;
        
        http_response_code(201); // Created
        echo json_encode([
            'success' => true,
            'message' => 'Usuário registrado com sucesso',
            'userId' => $userId
        ]);
    } else {
        throw new Exception("Erro ao inserir usuário no banco de dados: " . $mysqli->error);
    }
    
} catch (Exception $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'Erro no servidor: ' . $e->getMessage()]);
}
