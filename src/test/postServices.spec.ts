import { describe, it, expect } from 'vitest';
import { createCliente } from '../services/cliente.service';
import { createInmueble } from '../services/inmueble.service';
import { createDocumento } from '../services/documento.service';

describe('POST Services', () => {
  let clienteId: number;
  let inmuebleId: number;

  it('debe crear un cliente', async () => {
    const nuevoCliente = {
      tipoPersona: 'fisica',
      nombre: 'Cliente Prueba',
      apellidoPaterno: 'Apellido Paterno',
      apellidoMaterno: 'Apellido Materno',
      rfc: 'ABC123',
      fechaNacimiento: new Date('1990-01-01'),
      correo: 'cliente@prueba.com',
      telefono: '1234567890',
      domicilio: 'Calle Falsa 123',
      ciudad: 'Ciudad Prueba',
      estado: 'Estado Prueba',
      pais: 'País Prueba'
    };
    const response = await createCliente(nuevoCliente);
    expect(response).toBeDefined();
    clienteId = response.id; // Guarda el ID del cliente creado
  });

  it('debe crear un inmueble', async () => {
    const nuevoInmueble = new FormData();
    nuevoInmueble.append('clienteId', clienteId.toString()); // Usa el ID del cliente creado
    nuevoInmueble.append('direccion', '1600 Amphitheatre Parkway, Mountain View, CA'); // Dirección válida
    nuevoInmueble.append('valorMercado', '1000000');
    nuevoInmueble.append('ubicacionGeografica', JSON.stringify({ type: 'Point', coordinates: [100.0, 0.0] }));
    nuevoInmueble.append('file', new Blob(['contenido del archivo'], { type: 'text/plain' }), 'archivo.txt');
    const response = await createInmueble(nuevoInmueble);
    expect(response).toBeDefined();
    inmuebleId = response.id; // Guarda el ID del inmueble creado
  });

  it('debe crear un documento', async () => {
    const nuevoDocumento = new FormData();
    nuevoDocumento.append('inmuebleId', inmuebleId.toString()); // Usa el ID del inmueble creado
    nuevoDocumento.append('tipoDocumento', 'escritura');
    nuevoDocumento.append('documento', new Blob(['contenido del documento'], { type: 'application/pdf' }), 'documento.pdf');
    const response = await createDocumento(nuevoDocumento);
    expect(response).toBeDefined();
  });
});