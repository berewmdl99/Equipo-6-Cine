// /services/boletoService.js
import api from "../utils/api";

const obtenerBoletos = async () => {
  try {
    const response = await api.get("/boletos/");
    return response.data;
  } catch (error) {
    console.error("Error al obtener boletos:", error);
    throw new Error(error.response?.data?.detail || 'Error al obtener los boletos');
  }
};

const obtenerBoletoPorId = async (boletoId) => {
  try {
    if (!boletoId) {
      throw new Error('El ID del boleto es requerido');
    }
    const response = await api.get(`/boletos/${boletoId}/imprimir`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener el boleto');
  }
};

const crearBoleto = async (datos) => {
  try {
    // Asegurarnos que el usuario_id existe
    if (!datos.usuario_id) {
      throw new Error('El ID del usuario es requerido');
    }

    // Usar el mismo ID para usuario y vendedor
    const datosBoleto = {
      funcion_id: datos.funcion_id,
      asiento_id: datos.asiento_id,
      usuario_id: datos.usuario_id,
      vendedor_id: datos.usuario_id, // Usar el mismo ID del usuario
      precio: datos.precio,
      estado: datos.estado
    };

    console.log('Intentando crear boleto con datos:', datosBoleto);
    
    const response = await api.post("/boletos/", datosBoleto);
    return response.data;
  } catch (error) {
    console.error('Error al crear boleto:', error);
    console.error('Detalles del error:', error.response?.data);
    throw new Error(error.response?.data?.detail || 'Error al crear el boleto');
  }
};

const cancelarBoleto = async (boletoId) => {
  try {
    if (!boletoId) {
      throw new Error('El ID del boleto es requerido');
    }
    const response = await api.post(`/boletos/${boletoId}/cancelar`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al cancelar el boleto');
  }
};

const realizarPago = async (boletoId, datosPago) => {
  try {
    if (!boletoId) {
      throw new Error('El ID del boleto es requerido');
    }
    if (!datosPago.metodo_pago || !datosPago.monto) {
      throw new Error('Datos de pago incompletos');
    }
    
    const response = await api.post(`/boletos/${boletoId}/pagar`, datosPago);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al procesar el pago');
  }
};

const imprimirBoleto = async (boletos, pago, funcion) => {
  try {
    // Crear un elemento div temporal para el contenido del boleto
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      throw new Error('No se pudo abrir la ventana de impresión. Por favor, permita las ventanas emergentes.');
    }

    // Escribir el contenido HTML del boleto
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Boleto de Cine</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .boleto {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #ccc;
              padding: 20px;
              page-break-after: always;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #333;
            }
            .info {
              margin: 20px 0;
            }
            .info p {
              margin: 5px 0;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 0.9em;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
              }
              .boleto {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          ${boletos.map((boleto, index) => `
            <div class="boleto">
              <div class="header">
                <h1>Cine XYZ</h1>
                <p>${new Date().toLocaleDateString('es-MX', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
              
              <div class="info">
                <h2>${boleto.funcion.pelicula.titulo}</h2>
                <p><strong>Sala:</strong> ${boleto.funcion.sala.nombre}</p>
                <p><strong>Fecha:</strong> ${new Date(boleto.funcion.fecha).toLocaleDateString('es-MX', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p><strong>Hora:</strong> ${boleto.funcion.hora}</p>
                <p><strong>Asiento:</strong> ${boleto.asiento.fila}${boleto.asiento.numero}</p>
                <p><strong>Precio:</strong> $${boleto.precio}</p>
                <p><strong>Boleto ID:</strong> ${boleto.id}</p>
              </div>

              <div class="footer">
                <p>Gracias por su compra</p>
                <p>Este boleto es válido únicamente para la función especificada</p>
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `);

    // Esperar a que el contenido se cargue
    printWindow.document.close();
    printWindow.focus();

    // Imprimir después de un pequeño retraso para asegurar que todo el contenido esté cargado
    setTimeout(() => {
      printWindow.print();
      // Cerrar la ventana después de imprimir
      printWindow.close();
    }, 250);

    return true;
  } catch (error) {
    console.error('Error al imprimir boleto:', error);
    throw new Error(error.message || 'Error al imprimir el boleto');
  }
};

const boletoService = {
  obtenerBoletos,
  obtenerBoletoPorId,
  crearBoleto,
  cancelarBoleto,
  realizarPago,
  imprimirBoleto
};

export default boletoService;
