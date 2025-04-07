<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Tratar requisição OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Obter conexão com o banco
require_once 'conexao.php';

// Verificar se o usuário é admin baseado no email ou ID
$userId = isset($_GET['userId']) ? $_GET['userId'] : null;
$email = isset($_GET['email']) ? $_GET['email'] : null;

if (!$userId && !$email) {
    // Tentar obter do corpo da requisição para métodos POST
    $input = json_decode(file_get_contents("php://input"), true);
    $userId = isset($input['userId']) ? $input['userId'] : null;
    $email = isset($input['email']) ? $input['email'] : null;
}

// Se ainda não houver ID ou email
if (!$userId && !$email) {
    http_response_code(400);
    echo json_encode(['error' => 'ID do usuário ou email não fornecido']);
    exit;
}

try {
    // Obter o tipo de admin da tabela de configurações
    $configStmt = $mysqli->prepare("SELECT config_value FROM system_config WHERE config_key = 'admin_type'");
    $configStmt->execute();
    $configResult = $configStmt->get_result();
    
    if ($configResult->num_rows === 0) {
        throw new Exception("Configuração 'admin_type' não encontrada");
    }
    
    $adminType = $configResult->fetch_assoc()['config_value'];
    
    // Verificar se o usuário é admin
    if ($userId) {
        $stmt = $mysqli->prepare("SELECT tipo FROM usuarios WHERE id = ?");
        $stmt->bind_param("i", $userId);
    } else {
        $stmt = $mysqli->prepare("SELECT tipo FROM usuarios WHERE email = ?");
        $stmt->bind_param("s", $email);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['isAdmin' => false, 'message' => 'Usuário não encontrado']);
        exit;
    }
    
    $userType = $result->fetch_assoc()['tipo'];
    
    // Verificar se o tipo do usuário corresponde ao tipo admin
    $isAdmin = ($userType === $adminType);
    
    echo json_encode([
        'isAdmin' => $isAdmin,
        'userType' => $userType,
        'adminType' => $adminType
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao verificar status de admin: ' . $e->getMessage()]);
}

$mysqli->close();
