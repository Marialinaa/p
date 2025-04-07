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

// Pega o método HTTP
$method = $_SERVER['REQUEST_METHOD'];

// Verifica autenticação para métodos que não sejam GET
if ($method !== 'GET') {
    // Obter token de autorização
    $headers = getallheaders();
    $token = null;
    
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
        if (strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
        }
    }
    
    // Verificar se é um administrador
    $adminQuery = "SELECT u.id FROM usuarios u 
                   JOIN system_config c ON u.tipo = c.config_value AND c.config_key = 'admin_type'
                   WHERE u.token = ?";
    
    $stmt = $mysqli->prepare($adminQuery);
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Somente administradores podem modificar configurações']);
        exit;
    }
}

// Operações CRUD para configurações
switch ($method) {
    case 'GET':
        // Pegar uma configuração específica ou todas
        $configKey = isset($_GET['key']) ? $_GET['key'] : null;
        
        if ($configKey) {
            $stmt = $mysqli->prepare("SELECT * FROM system_config WHERE config_key = ?");
            $stmt->bind_param("s", $configKey);
        } else {
            $stmt = $mysqli->prepare("SELECT * FROM system_config");
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $configs = [];
        
        while ($row = $result->fetch_assoc()) {
            $configs[] = $row;
        }
        
        echo json_encode(['configs' => $configs]);
        break;
        
    case 'POST':
        // Adicionar ou atualizar uma configuração
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($input['key']) || !isset($input['value'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Chave e valor são obrigatórios']);
            exit;
        }
        
        // Verificar se já existe
        $stmt = $mysqli->prepare("SELECT id FROM system_config WHERE config_key = ?");
        $stmt->bind_param("s", $input['key']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // Atualizar existente
            $stmt = $mysqli->prepare("UPDATE system_config SET config_value = ?, description = ?, updated_at = NOW() WHERE config_key = ?");
            $description = isset($input['description']) ? $input['description'] : null;
            $stmt->bind_param("sss", $input['value'], $description, $input['key']);
        } else {
            // Adicionar nova
            $stmt = $mysqli->prepare("INSERT INTO system_config (config_key, config_value, description) VALUES (?, ?, ?)");
            $description = isset($input['description']) ? $input['description'] : null;
            $stmt->bind_param("sss", $input['key'], $input['value'], $description);
        }
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Configuração salva com sucesso']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao salvar configuração: ' . $mysqli->error]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
}

$mysqli->close();
