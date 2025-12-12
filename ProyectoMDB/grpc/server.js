const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { MongoClient, ObjectId } = require("mongodb");

const PROTO_PATH = __dirname + "/proyecto.proto";

const pkgDef = protoLoader.loadSync(PROTO_PATH, {});
const proto = grpc.loadPackageDefinition(pkgDef).proyecto;

//const MONGO_URL = "mongodb://mongo:27017";
const MONGO_URL = "mongodb://host.docker.internal:27017";
let coleccion;

async function conectarMongo() {
  const cliente = new MongoClient(MONGO_URL);
  await cliente.connect();
  const db = cliente.db("Projatt");
  coleccion = db.collection("Usuarios");
  console.log("Conectado a Mongo desde gRPC");
}

async function CrearUsuario(call, callback) {
  try {
    const u = call.request.usuario;
    const doc = {
      nombre: u.nombre,
      contrasena: u.contrasena,
      correo: u.correo,
      telefono: u.telefono,
      rol: u.rol
    };

    const res = await coleccion.insertOne(doc);
    doc.id = res.insertedId.toString();

    callback(null, { usuario: doc });
  } catch (e) { callback(null, { error: e.toString() }); }
}

async function ObtenerUsuario(call, callback) {
  try {
    const id = call.request.id;
    const doc = await coleccion.findOne({ _id: new ObjectId(id) });

    if (!doc) return callback(null, { error: "No encontrado" });

    doc.id = doc._id.toString();
    delete doc._id;

    callback(null, { usuario: doc });
  } catch (e) { callback(null, { error: e.toString() }); }
}

async function EliminarUsuario(call, callback) {
  try {
    const id = call.request.id;
    const res = await coleccion.deleteOne({ _id: new ObjectId(id) });
    callback(null, { success: res.deletedCount === 1 });
  } catch (e) { callback(null, { error: e.toString() }); }
}

async function ListarUsuarios(call, callback) {
  try {
    const arr = await coleccion.find().toArray();
    const usuarios = arr.map(u => ({
      id: u._id.toString(),
      nombre: u.nombre,
      contrasena: u.contrasena,
      correo: u.correo,
      telefono: u.telefono,
      rol: u.rol
    }));

    callback(null, { usuarios });
  } catch (e) { callback(null, { error: e.toString() }); }
}

async function EditarUsuario(call, callback) {
  try {
    const id = call.request.id;
    const nuevosDatos = call.request.usuario;

    const updateDoc = {
      $set: {
        nombre: nuevosDatos.nombre,
        contrasena: nuevosDatos.contrasena,
        correo: nuevosDatos.correo,
        telefono: nuevosDatos.telefono,
        rol: nuevosDatos.rol
      }
    };

    const res = await coleccion.updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    );

    if (res.matchedCount === 0) {
      return callback(null, { error: "Usuario no encontrado" });
    }

    const doc = await coleccion.findOne({ _id: new ObjectId(id) });
    doc.id = doc._id.toString();
    delete doc._id;

    callback(null, { usuario: doc });
  } catch (e) {
    callback(null, { error: e.toString() });
  }
}


async function main() {
  await conectarMongo();

  const server = new grpc.Server();
  server.addService(proto.UsuarioService.service, {
    CrearUsuario,
    ObtenerUsuario,
    EliminarUsuario,
    ListarUsuarios,
    EditarUsuario
  });

  server.bindAsync("0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    () => {
      console.log("gRPC escuchando en 50051");
      server.start();
    }
  );
}

main();