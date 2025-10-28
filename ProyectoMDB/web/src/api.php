<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require __DIR__ . '/../vendor/autoload.php';

//no sirve en windows pipipi
// $cliente = new MongoDB\Client("mongodb://mongo:27017"); 
$cliente = new MongoDB\Client("mongodb://host.docker.internal:27017");
$db = $cliente->Projatt;
$coleccion = $db->Usuarios;

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (preg_match('#(api\.php)?/api/users$#', $path)) {

    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            try {
                $id = $_GET['id'];
                $doc = $coleccion->findOne(['_id' => new MongoDB\BSON\ObjectId($id)]);
                if ($doc) {
                    echo json_encode($doc);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Usuario no encontrado']);
                }
            } catch (Throwable $e) {
                http_response_code(400);
                echo json_encode(['error' => 'ID inválido']);
            }
            exit;
        }

        // Listar todos
        $cursor = $coleccion->find()->toArray();
        echo json_encode($cursor);
        exit;
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (
            !is_array($input) ||
            !isset($input['nombre']) ||
            !isset($input['contraseña']) ||
            !isset($input['correo']) ||
            !isset($input['telefono']) ||
            !isset($input['rol'])
        ) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalido. JSON con nombre, contraseña, correo, telefono y rol.']);
            exit;
        }

        $doc = [
            'nombre' => $input['nombre'],
            'contraseña' => $input['contraseña'],
            'correo' => $input['correo'],
            'telefono' => $input['telefono'],
            'rol' => $input['rol']
        ];

        $result = $coleccion->insertOne($doc);
        echo json_encode(['insertedId' => (string)$result->getInsertedId()]);
        exit;
    }

    if ($method === 'DELETE') {
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta id']);
            exit;
        }

        try {
            $id = $_GET['id'];
            $result = $coleccion->deleteOne(['_id' => new MongoDB\BSON\ObjectId($id)]);
            echo json_encode(['deletedCount' => $result->getDeletedCount()]);
        } catch (Throwable $e) {
            http_response_code(400);
            echo json_encode(['error' => 'ID invalido']);
        }
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Metodo no soportado']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Ruta no encontrada']);
