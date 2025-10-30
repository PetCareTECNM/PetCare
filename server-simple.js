const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuración del servidor
const PORT = 3000;

// Tipos MIME para servir archivos estáticos
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json'
};

// Base de datos simulada (aquí reemplazaremos con SQL Server)
let pacientesDB = [
  {
    ID: 'PET001',
    NOMBRE: 'Luke',
    ESPECIE: 'Gato',
    RAZA: 'De colores',
    NACIMEINTO: '2024-10-24',
    PROPIETARIO: 'Alex'
  },
  {
    ID: 'PET002',
    NOMBRE: 'Güero',
    ESPECIE: 'Gato',
    RAZA: 'Naranja',
    NACIMEINTO: '2024-05-23',
    PROPIETARIO: 'Fresy'
  }
];

// Función para servir archivos estáticos
function serveStatic(res, filePath) {
  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code == 'ENOENT') {
        res.writeHead(404);
        res.end('Archivo no encontrado');
      } else {
        res.writeHead(500);
        res.end('Error del servidor');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

// Crear el servidor
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Configurar CORS para permitir conexiones desde el navegador
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    
    // Login
    if (pathname === '/api/login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { username, password } = JSON.parse(body);
          if (username === 'admin' && password === 'admin123') {
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, user: { role: 'admin' } }));
          } else {
            res.writeHead(200);
            res.end(JSON.stringify({ success: false, message: 'Credenciales incorrectas' }));
          }
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'Datos inválidos' }));
        }
      });
      return;
    }

    // Test de conexión
    if (pathname === '/api/test' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Servidor funcionando', 
        totalPacientes: pacientesDB.length 
      }));
      return;
    }

    // Obtener pacientes
    if (pathname === '/api/pacientes' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(pacientesDB));
      return;
    }

    // Registrar paciente
    if (pathname === '/api/pacientes' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const paciente = JSON.parse(body);
          
          // Validar que no exista el ID
          const existe = pacientesDB.find(p => p.ID === paciente.id);
          if (existe) {
            res.writeHead(200);
            res.end(JSON.stringify({ success: false, error: 'ID ya existe' }));
            return;
          }

          // Agregar paciente
          const nuevoPaciente = {
            ID: paciente.id,
            NOMBRE: paciente.nombre.toUpperCase(),
            ESPECIE: paciente.especie.charAt(0).toUpperCase() + paciente.especie.slice(1),
            RAZA: paciente.raza,
            NACIMEINTO: paciente.nacimiento,
            PROPIETARIO: paciente.propietario
          };

          pacientesDB.unshift(nuevoPaciente);

          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: 'Paciente registrado' }));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'Datos inválidos' }));
        }
      });
      return;
    }

    // Eliminar paciente
    if (pathname.startsWith('/api/pacientes/') && req.method === 'DELETE') {
      const id = pathname.split('/')[3];
      const index = pacientesDB.findIndex(p => p.ID === id);
      
      if (index !== -1) {
        pacientesDB.splice(index, 1);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Paciente eliminado' }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Paciente no encontrado' }));
      }
      return;
    }

    // Si no coincide ninguna ruta de API
    res.writeHead(404);
    res.end(JSON.stringify({ success: false, error: 'Endpoint no encontrado' }));
    return;
  }

  // Servir archivos estáticos
  let filePath = '.' + pathname;
  if (filePath == './') {
    filePath = './login.html';
  }

  serveStatic(res, filePath);
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log('🚀 Servidor iniciado');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
  console.log('💾 Base de datos: SIMULADA (cambiar a SQL Server)');
  console.log('================================');
});