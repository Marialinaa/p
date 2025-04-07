<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Conexão com o banco (ajuste o nome, usuário e senha conforme necessário)
$pdo = new PDO('mysql:host=localhost;dbname=tankbdm', 'admin123', '');
if (!$pdo) {
    die(json_encode(['erro' => 'Erro ao conectar com o banco de dados']));
  }
  
// Detecta o método HTTP
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);

// Pega o usuarioId (admin) do parâmetro GET ou do JSON recebido
$usuarioId = $_GET['usuarioId'] ?? $input['usuarioId'] ?? null;

if (!$usuarioId) {
    http_response_code(400);
    echo json_encode(['erro' => 'ID do usuário não fornecido']);
    exit;
}

// 🔒 Verifica se o usuário é admin - Corrigido para aceitar 'admin123' como tipo de administrador
$stmt = $pdo->prepare("SELECT tipo FROM usuarios WHERE id = ?");
$stmt->execute([$usuarioId]);
$tipo = $stmt->fetchColumn();

if ($tipo !== 'admin123') {
    http_response_code(403);
    echo json_encode(['erro' => 'Apenas administradores têm acesso']);
    exit;
}

// 🔧 Operações CRUD
switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT id, nome, email, tipo FROM usuarios");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        // Garantir que o tipo padrão seja 'user' se não for especificado
        $tipo = isset($input['tipo']) ? $input['tipo'] : 'user';
        
        // Se o email é admin@admin.com, forçar tipo admin123
        if ($input['email'] === 'admin@admin.com') {
            $tipo = 'admin123';
        }
        
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $input['nome'],
            $input['email'],
            password_hash($input['senha'], PASSWORD_DEFAULT),
            $tipo
        ]);
        echo json_encode(['status' => 'Criado com sucesso']);
        break;

    case 'PUT':
        // Verificar se estamos atualizando o email admin@admin.com
        $stmt = $pdo->prepare("SELECT email FROM usuarios WHERE id = ?");
        $stmt->execute([$input['id']]);
        $email = $stmt->fetchColumn();
        
        // Se email for admin@admin.com, manter o tipo como admin123
        if ($email === 'admin@admin.com') {
            $tipo = 'admin123';
        } else {
            $tipo = $input['tipo'] ?? 'user';
        }
        
        $stmt = $pdo->prepare("UPDATE usuarios SET nome = ?, email = ?, tipo = ? WHERE id = ?");
        $stmt->execute([
            $input['nome'],
            $input['email'],
            $tipo,
            $input['id']
        ]);
        echo json_encode(['status' => 'Atualizado com sucesso']);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['erro' => 'ID para deletar não fornecido']);
            exit;
        }
        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['status' => 'Deletado com sucesso']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['erro' => 'Método não suportado']);
        break;
}
