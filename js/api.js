// Configuración de la API - CONEXIÓN LOCAL
const API_BASE_URL = 'http://localhost:3001';

// Función para hacer peticiones HTTP
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en API request:', error);
    throw error;
  }
}

// Función para generar IDs únicos
function generarID() {
  return 'ID' + Date.now().toString();
}

// 1. LOGIN
async function loginUsuario(username, password) {
  return await apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

// 2. PACIENTES
async function registrarPaciente(datos) {
  const pacienteData = {
    id: datos.id || generarID(),
    nombre: datos.nombre,
    especie: datos.especie,
    raza: datos.raza,
    nacimiento: datos.fechaNacimiento,
    propietario: datos.propietario
  };
  
  return await apiRequest('/pacientes', {
    method: 'POST',
    body: JSON.stringify(pacienteData)
  });
}

async function buscarPacientes(filtros) {
  const params = new URLSearchParams();
  if (filtros.id) params.append('id', filtros.id);
  if (filtros.nombre) params.append('nombre', filtros.nombre);
  
  return await apiRequest(`/pacientes?${params}`);
}

async function obtenerTodosPacientes() {
  return await apiRequest('/pacientes');
}

// 3. CONSULTAS
async function registrarConsulta(datos) {
  const consultaData = {
    idConsulta: datos.idConsulta || generarID(),
    idMascota: datos.idMascota,
    nombrePaciente: datos.nombrePaciente,
    detallesPaciente: datos.detallesPaciente || '',
    motivo: datos.motivo,
    fecha: datos.fecha,
    diagnostico: datos.diagnostico
  };
  
  return await apiRequest('/consultas', {
    method: 'POST',
    body: JSON.stringify(consultaData)
  });
}

async function buscarConsultas(filtros) {
  const params = new URLSearchParams();
  if (filtros.idConsulta) params.append('idConsulta', filtros.idConsulta);
  if (filtros.idMascota) params.append('idMascota', filtros.idMascota);
  
  return await apiRequest(`/consultas?${params}`);
}

// 8. FUNCIONES DE UTILIDAD
async function registrarAseo(datos) {
  const aseoData = {
    idAseo: datos.idAseo || generarID(),
    idMascota: datos.idMascota,
    tipoBanio: datos.tipoBanio,
    esAgresivo: datos.esAgresivo,
    fechaBanio: datos.fechaBanio,
    propietario: datos.propietario
  };
  
  return await apiRequest('/aseo', {
    method: 'POST',
    body: JSON.stringify(aseoData)
  });
}

// 5. HOSPEDAJE
async function registrarHospedaje(datos) {
  const hospedajeData = {
    idReservacion: datos.idReservacion || generarID(),
    idMascota: datos.idMascota,
    fechaIngreso: datos.fechaIngreso,
    fechaEgreso: datos.fechaEgreso,
    comentario: datos.comentario
  };
  
  return await apiRequest('/hospedaje', {
    method: 'POST',
    body: JSON.stringify(hospedajeData)
  });
}

// 6. PRODUCTOS
async function obtenerProductos() {
  return await apiRequest('/productos');
}

async function agregarProducto(datos) {
  const productoData = {
    idProducto: datos.idProducto || generarID(),
    nombre: datos.nombre,
    precio: parseFloat(datos.precio),
    stock: parseInt(datos.stock)
  };
  
  return await apiRequest('/productos', {
    method: 'POST',
    body: JSON.stringify(productoData)
  });
}

// 7. HISTORIAL
async function obtenerHistorialMascota(idMascota) {
  return await apiRequest(`/historial/${idMascota}`);
}
function mostrarMensaje(mensaje, tipo = 'info') {
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion ${tipo}`;
  notificacion.textContent = mensaje;
  
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 10px;
    color: white;
    font-weight: bold;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
  `;
  
  if (tipo === 'success') notificacion.style.background = '#28a745';
  else if (tipo === 'error') notificacion.style.background = '#dc3545';
  else if (tipo === 'warning') notificacion.style.background = '#ffc107';
  else notificacion.style.background = '#007bff';
  
  document.body.appendChild(notificacion);
  
  setTimeout(() => {
    notificacion.remove();
  }, 3000);
}

function formatearFecha(fecha) {
  if (!fecha) return '';
  const date = new Date(fecha);
  return date.toISOString().split('T')[0];
}

// 5. TEST DE CONEXIÓN
async function testConexion() {
  try {
    const response = await apiRequest('/test');
    return response;
  } catch (error) {
    throw error;
  }
}

// Exportar funciones
window.API = {
  loginUsuario,
  registrarPaciente,
  buscarPacientes,
  obtenerTodosPacientes,
  registrarConsulta,
  buscarConsultas,
  registrarAseo,
  registrarHospedaje,
  obtenerProductos,
  agregarProducto,
  obtenerHistorialMascota,
  mostrarMensaje,
  formatearFecha,
  generarID,
  testConexion
};