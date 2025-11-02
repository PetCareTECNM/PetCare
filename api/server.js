const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const sql = require('mssql');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3002; // Puerto de API
const DB_PROVIDER = (process.env.DB_PROVIDER || 'mssql').toLowerCase(); // 'mssql' | 'mongo'

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Configuración de SQL Server (variables de entorno con fallback)
const mssqlConfig = {
  server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.DB_DATABASE || 'RegistroDeVeterinaria',
  user: process.env.DB_USER || undefined,
  password: process.env.DB_PASSWORD || undefined,
  options: {
    encrypt: process.env.DB_ENCRYPT ? process.env.DB_ENCRYPT === 'true' : false,
    trustServerCertificate: true
  }
};

// Configuración de MongoDB Atlas (cadena completa en MONGODB_URI)
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || (process.env.DB_DATABASE || 'RegistroDeVeterinaria');

let pool; // MSSQL pool
let mongoClient; // Mongo client
let mongoDb; // Mongo database instance

// Conectar a SQL Server
async function conectarMSSQL() {
  try {
    pool = await sql.connect(mssqlConfig);
    console.log('✅ Conectado a SQL Server');
    return true;
  } catch (error) {
    console.error('❌ Error MSSQL:', error.message);
    return false;
  }
}

// Conectar a MongoDB
async function conectarMongo() {
  try {
    if (!MONGODB_URI) throw new Error('MONGODB_URI no configurado');
    mongoClient = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGODB_DB);
    // Índices útiles
    await mongoDb.collection('pacientes').createIndex({ ID: 1 }, { unique: true });
    await mongoDb.collection('pacientes').createIndex({ NOMBRE: 'text' });
    await mongoDb.collection('DatosConsulta').createIndex({ Id_Consulta: 1 }, { unique: true });
    await mongoDb.collection('DatosConsulta').createIndex({ ID_Mascota: 1 });
    console.log('✅ Conectado a MongoDB Atlas');
    return true;
  } catch (error) {
    console.error('❌ Error MongoDB:', error.message);
    return false;
  }
}

// Ruta principal
app.get('/', (req, res) => res.redirect('/login.html'));

// Test de conexión
app.get('/test', async (req, res) => {
  try {
    if (DB_PROVIDER === 'mongo') {
      if (!mongoDb) await conectarMongo();
      const total = await mongoDb.collection('pacientes').countDocuments();
      res.json({ success: true, proveedor: 'mongo', mensaje: 'Conexión exitosa', totalPacientes: total });
    } else {
      if (!pool) await conectarMSSQL();
      const result = await pool.request().query('SELECT COUNT(*) as total FROM PACIENTES');
      res.json({ success: true, proveedor: 'mssql', mensaje: 'Conexión exitosa', totalPacientes: result.recordset[0].total });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Credenciales incorrectas' });
  }
});

// Registrar paciente
app.post('/pacientes', async (req, res) => {
  try {
    const { id, nombre, especie, raza, nacimiento, propietario } = req.body;
    if (DB_PROVIDER === 'mongo') {
      if (!mongoDb) await conectarMongo();
      await mongoDb.collection('pacientes').updateOne(
        { ID: id },
        { $set: { ID: id, NOMBRE: nombre, ESPECIE: especie, RAZA: raza, NACIMIENTO: nacimiento ? new Date(nacimiento) : null, PROPIETARIO: propietario, UPDATED_AT: new Date() }, $setOnInsert: { CREATED_AT: new Date() } },
        { upsert: true }
      );
      res.json({ success: true, message: 'Paciente registrado (Mongo)' });
    } else {
      if (!pool) await conectarMSSQL();
      await pool.request()
        .input('ID', sql.VarChar(30), id)
        .input('NOMBRE', sql.VarChar(30), nombre)
        .input('ESPECIE', sql.VarChar(30), especie)
        .input('RAZA', sql.VarChar(30), raza)
        .input('NACIMEINTO', sql.Date, nacimiento)
        .input('PROPIETARIO', sql.VarChar(30), propietario)
        .execute('INGRESA_PACIENTE');
      res.json({ success: true, message: 'Paciente registrado (MSSQL)' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Buscar pacientes
app.get('/pacientes', async (req, res) => {
  try {
    const { id, nombre } = req.query;
    if (DB_PROVIDER === 'mongo') {
      if (!mongoDb) await conectarMongo();
      const filter = {};
      if (id) filter.ID = id;
      if (nombre) filter.NOMBRE = { $regex: nombre, $options: 'i' };
      const docs = await mongoDb.collection('pacientes').find(filter).toArray();
      res.json(docs);
    } else {
      if (!pool) await conectarMSSQL();
      let query = 'SELECT * FROM PACIENTES WHERE 1=1';
      const request = pool.request();
      if (id) { query += ' AND ID = @id'; request.input('id', sql.VarChar(30), id); }
      if (nombre) { query += ' AND NOMBRE LIKE @nombre'; request.input('nombre', sql.VarChar(30), `%${nombre}%`); }
      const result = await request.query(query);
      res.json(result.recordset);
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Eliminar paciente
app.delete('/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'ID requerido' });

    if (DB_PROVIDER === 'mongo') {
      if (!mongoDb) await conectarMongo();
      const result = await mongoDb.collection('pacientes').deleteOne({ ID: id });
      if (result.deletedCount === 0) {
        return res.json({ success: false, error: 'Paciente no encontrado' });
      }
      res.json({ success: true, message: 'Paciente eliminado (Mongo)' });
    } else {
      if (!pool) await conectarMSSQL();
      const result = await pool.request()
        .input('id', sql.VarChar(30), id)
        .query('DELETE FROM PACIENTES WHERE ID = @id');
      // En MSSQL, result.rowsAffected es un array por lote, tomamos el total
      const affected = Array.isArray(result.rowsAffected) ? result.rowsAffected.reduce((a, b) => a + b, 0) : (result.rowsAffected || 0);
      if (affected === 0) {
        return res.json({ success: false, error: 'Paciente no encontrado' });
      }
      res.json({ success: true, message: 'Paciente eliminado (MSSQL)' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Registrar consulta
app.post('/consultas', async (req, res) => {
  try {
    const { idConsulta, idMascota, nombrePaciente, detallesPaciente, motivo, fecha, diagnostico } = req.body;
    if (DB_PROVIDER === 'mongo') {
      if (!mongoDb) await conectarMongo();
      await mongoDb.collection('DatosConsulta').updateOne(
        { Id_Consulta: idConsulta },
        { $set: { Id_Consulta: idConsulta, ID_Mascota: idMascota, Nombre_Paciente: nombrePaciente, Detalles_Paciente: detallesPaciente || '', Motivo: motivo, Fecha: fecha ? new Date(fecha) : null, Diagnostico: diagnostico, UPDATED_AT: new Date() }, $setOnInsert: { CREATED_AT: new Date() } },
        { upsert: true }
      );
      res.json({ success: true, message: 'Consulta registrada (Mongo)' });
    } else {
      if (!pool) await conectarMSSQL();
      await pool.request()
        .input('Id_Consulta', sql.VarChar(30), idConsulta)
        .input('ID_Mascota', sql.VarChar(30), idMascota)
        .input('Nombre_Paciente', sql.VarChar(30), nombrePaciente)
        .input('Detalles_Paciente', sql.VarChar(sql.MAX), detallesPaciente || '')
        .input('Motivo', sql.VarChar(sql.MAX), motivo)
        .input('Fecha', sql.Date, fecha)
        .input('Diagnostico', sql.VarChar(sql.MAX), diagnostico)
        .execute('INGRESA_CONSULTA');
      res.json({ success: true, message: 'Consulta registrada (MSSQL)' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Buscar consultas
app.get('/consultas', async (req, res) => {
  try {
    const { idConsulta, idMascota } = req.query;
    if (DB_PROVIDER === 'mongo') {
      if (!mongoDb) await conectarMongo();
      const pipeline = [];
      if (idConsulta) pipeline.push({ $match: { Id_Consulta: idConsulta } });
      if (idMascota) pipeline.push({ $match: { ID_Mascota: idMascota } });
      pipeline.push(
        { $lookup: { from: 'pacientes', localField: 'ID_Mascota', foreignField: 'ID', as: 'pac' } },
        { $addFields: { NombreMascota: { $ifNull: [ { $arrayElemAt: ['$pac.NOMBRE', 0] }, null ] } } },
        { $project: { pac: 0 } }
      );
      const docs = await mongoDb.collection('DatosConsulta').aggregate(pipeline).toArray();
      res.json(docs);
    } else {
      if (!pool) await conectarMSSQL();
      let query = `SELECT dc.*, p.NOMBRE as NombreMascota 
                   FROM DatosConsulta dc 
                   LEFT JOIN PACIENTES p ON dc.ID_Mascota = p.ID 
                   WHERE 1=1`;
      const request = pool.request();
      if (idConsulta) { query += ' AND dc.Id_Consulta = @idConsulta'; request.input('idConsulta', sql.VarChar(30), idConsulta); }
      if (idMascota) { query += ' AND dc.ID_Mascota = @idMascota'; request.input('idMascota', sql.VarChar(30), idMascota); }
      const result = await request.query(query);
      res.json(result.recordset);
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Iniciar servidor
async function iniciar() {
  console.log('🚀 Iniciando Pet Care API...');
  let conectado = false;
  if (DB_PROVIDER === 'mongo') {
    conectado = await conectarMongo();
  } else {
    conectado = await conectarMSSQL();
  }
  
  app.listen(PORT, () => {
    console.log('================================');
    console.log(`🎉 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🧪 Test: http://localhost:${PORT}/test`);
    console.log(`💾 Base de datos (${DB_PROVIDER.toUpperCase()}): ${conectado ? 'CONECTADA ✅' : 'DESCONECTADA ❌'}`);
    console.log('================================');
  });
}

iniciar();