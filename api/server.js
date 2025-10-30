const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3002; // Cambiar puerto para evitar conflictos

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Configuración de SQL Server 
const config = {
  server: 'localhost\\SQLEXPRESS', // Usar localhost
  database: 'RegistroDeVeterinaria',
  options: {
    trustedConnection: true,
    enableArithAbort: true,
    trustServerCertificate: true
  }
};

let pool;

// Conectar a la base de datos
async function conectar() {
  try {
    pool = await sql.connect(config);
    console.log('✅ Conectado a SQL Server');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Ruta principal
app.get('/', (req, res) => res.redirect('/login.html'));

// Test de conexión
app.get('/test', async (req, res) => {
  try {
    if (!pool) await conectar();
    const result = await pool.request().query('SELECT COUNT(*) as total FROM PACIENTES');
    res.json({ 
      success: true, 
      mensaje: 'Conexión exitosa',
      totalPacientes: result.recordset[0].total 
    });
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
    if (!pool) await conectar();
    const { id, nombre, especie, raza, nacimiento, propietario } = req.body;
    
    await pool.request()
      .input('ID', sql.VarChar(30), id)
      .input('NOMBRE', sql.VarChar(30), nombre)
      .input('ESPECIE', sql.VarChar(30), especie)
      .input('RAZA', sql.VarChar(30), raza)
      .input('NACIMEINTO', sql.Date, nacimiento)
      .input('PROPIETARIO', sql.VarChar(30), propietario)
      .execute('INGRESA_PACIENTE');
    
    res.json({ success: true, message: 'Paciente registrado' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Buscar pacientes
app.get('/pacientes', async (req, res) => {
  try {
    if (!pool) await conectar();
    const { id, nombre } = req.query;
    
    let query = 'SELECT * FROM PACIENTES WHERE 1=1';
    const request = pool.request();
    
    if (id) {
      query += ' AND ID = @id';
      request.input('id', sql.VarChar(30), id);
    }
    if (nombre) {
      query += ' AND NOMBRE LIKE @nombre';
      request.input('nombre', sql.VarChar(30), `%${nombre}%`);
    }
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Registrar consulta
app.post('/consultas', async (req, res) => {
  try {
    if (!pool) await conectar();
    const { idConsulta, idMascota, nombrePaciente, detallesPaciente, motivo, fecha, diagnostico } = req.body;
    
    await pool.request()
      .input('Id_Consulta', sql.VarChar(30), idConsulta)
      .input('ID_Mascota', sql.VarChar(30), idMascota)
      .input('Nombre_Paciente', sql.VarChar(30), nombrePaciente)
      .input('Detalles_Paciente', sql.VarChar(sql.MAX), detallesPaciente || '')
      .input('Motivo', sql.VarChar(sql.MAX), motivo)
      .input('Fecha', sql.Date, fecha)
      .input('Diagnostico', sql.VarChar(sql.MAX), diagnostico)
      .execute('INGRESA_CONSULTA');
    
    res.json({ success: true, message: 'Consulta registrada' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Buscar consultas
app.get('/consultas', async (req, res) => {
  try {
    if (!pool) await conectar();
    const { idConsulta, idMascota } = req.query;
    
    let query = `SELECT dc.*, p.NOMBRE as NombreMascota 
                 FROM DatosConsulta dc 
                 LEFT JOIN PACIENTES p ON dc.ID_Mascota = p.ID 
                 WHERE 1=1`;
    const request = pool.request();
    
    if (idConsulta) {
      query += ' AND dc.Id_Consulta = @idConsulta';
      request.input('idConsulta', sql.VarChar(30), idConsulta);
    }
    if (idMascota) {
      query += ' AND dc.ID_Mascota = @idMascota';
      request.input('idMascota', sql.VarChar(30), idMascota);
    }
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Iniciar servidor
async function iniciar() {
  console.log('🚀 Iniciando Pet Care API...');
  
  const conectado = await conectar();
  
  app.listen(PORT, () => {
    console.log('================================');
    console.log(`🎉 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🧪 Test: http://localhost:${PORT}/test`);
    console.log(`💾 Base de datos: ${conectado ? 'CONECTADA ✅' : 'DESCONECTADA ❌'}`);
    console.log('================================');
  });
}

iniciar();