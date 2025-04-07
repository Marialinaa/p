<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Tratar requisição OPTIONS para CORS
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

// Obter dados da requisição
$dados = json_decode(file_get_contents("php://input"), true);

if (!isset($dados['query'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Consulta SQL não fornecida']);
    exit;
}

$query = $dados['query'];
$params = isset($dados['params']) ? $dados['params'] : [];

// Verificações de segurança adicionais
$operacaoSensivel = false;

// Verificar se a query contém operações sensíveis (DELETE, TRUNCATE, DROP)
$patternSensivel = '/\b(DELETE|TRUNCATE|DROP)\b/i';
if (preg_match($patternSensivel, $query)) {
    $operacaoSensivel = true;
}

// Se for uma operação sensível, verificar se tem token de autenticação
if ($operacaoSensivel) {
    $headers = getallheaders();
    $token = null;
    
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
        if (strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
        }
    }
    
    // Verificar se token existe e é válido (implementar sua lógica)
    if (!$token || !verificarToken($token)) {
        http_response_code(403);
        echo json_encode(['error' => 'Operação não permitida. Autenticação necessária.']);
        exit;
    }
}

// Log de operações sensíveis para rastreabilidade
if ($operacaoSensivel) {
    gravarLog($query, $params);
}

// Conexão com o banco de dados
try {
    require_once 'conexao.php';
    
    // Log para depuração
    error_log("Executando query: " . $query);
    error_log("Parâmetros: " . json_encode($params));
    
    // Preparar e executar a consulta
    $stmt = $mysqli->prepare($query);
    
    if (!$stmt) {
        throw new Exception("Erro ao preparar a consulta: " . $mysqli->error);
    }
    
    // Bind de parâmetros se existirem
    if (!empty($params)) {
        // Criar tipos para bind_param
        $types = '';
        $bindParams = [];
        
        foreach ($params as $param) {
            if (is_int($param)) {
                $types .= 'i'; // integer
            } elseif (is_float($param)) {
                $types .= 'd'; // double
            } elseif (is_string($param)) {
                $types .= 's'; // string
            } else {
                $types .= 's'; // default to string
            }
            
            $bindParams[] = $param;
        }
        
        // Criar array de referências para bind_param
        $bindParamRefs = [];
        $bindParamRefs[] = $types;
        
        for ($i = 0; $i < count($bindParams); $i++) {
            $bindParamRefs[] = &$bindParams[$i];
        }
        
        // Chamar bind_param com referências
        call_user_func_array([$stmt, 'bind_param'], $bindParamRefs);
    }
    
    // Executar a consulta
    if (!$stmt->execute()) {
        throw new Exception("Erro ao executar a consulta: " . $stmt->error);
    }
    
    // Para SELECT, obter resultados
    if (strpos(strtoupper($query), 'SELECT') === 0) {
        $result = $stmt->get_result();
        $data = [];
        
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        echo json_encode(['data' => $data]);
    }
    // Para INSERT, retornar o ID inserido
    elseif (strpos(strtoupper($query), 'INSERT') === 0) {
        echo json_encode([
            'success' => true,
            'insertId' => $mysqli->insert_id,
            'affectedRows' => $mysqli->affected_rows
        ]);
    }
    // Para UPDATE ou DELETE, retornar linhas afetadas
    else {
        echo json_encode([
            'success' => true,
            'affectedRows' => $mysqli->affected_rows
        ]);
    }
    
    $stmt->close();
    $mysqli->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    error_log("Erro na execução da query: " . $e->getMessage());
}

// Função simples para verificar token (implemente de acordo com sua lógica de autenticação)
function verificarToken($token) {
    // Implemente sua lógica de verificação de token aqui
    // Por exemplo, verificar em banco de dados ou validar JWT
    return true; // Simplificado para o exemplo
}

// Função para gravar log de operações sensíveis
function gravarLog($query, $params) {
    $logFile = __DIR__ . '/logs/database_operations.log';
    $logDir = dirname($logFile);
    
    // Criar diretório de logs se não existir
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    $paramsJson = json_encode($params);
    
    $logEntry = "[{$timestamp}] IP: {$ip} | User-Agent: {$userAgent} | Query: {$query} | Params: {$paramsJson}\n";
    
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}
