export type SearchType = 'nombre' | 'direccion' | 'rfc';

// Interfaz para representar una sugerencia de búsqueda
export interface ISuggestion {
  id?: number;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  razonSocial?: string;
  nombreCliente?: string;
  nombreDisplay?: string;
  clienteId?: number;
  rfc?: string;
  direccion?: string;
  domicilio?: string;
  calle?: string;
  numeroExterior?: string;
  colonia?: string;
  tipoPersona?: 'fisica' | 'moral';
  cantidadInmuebles?: number;
  estatus?: string;
  valorMercado?: number;
  [key: string]: any; // Para permitir acceso a propiedades dinámicas
}

/**
 * Formatea el texto para la etiqueta del marcador en el mapa
 * @param marker Objeto con información del inmueble para el marcador
 * @returns Texto formateado para la etiqueta del marcador
 */
export function formatMarkerLabel(marker: any): string {
  let label = '';
  
  // Mostrar nombre del cliente si está disponible
  if (marker.nombreCliente) {
    // Limitar el nombre a 15 caracteres para que no sea muy largo
    const nombreCorto = marker.nombreCliente.length > 15 
      ? marker.nombreCliente.substring(0, 15) + '...' 
      : marker.nombreCliente;
    label = nombreCorto;
  }
  
  // Añadir el precio del inmueble
  if (marker.valorMercado) {
    const valor = Number(marker.valorMercado);
    if (!isNaN(valor)) {
      // Formatear en K o M para valores grandes
      let precioFormateado = '';
      if (valor >= 1000000) {
        precioFormateado = `$${(valor / 1000000).toFixed(1)}M`;
      } else if (valor >= 1000) {
        precioFormateado = `$${(valor / 1000).toFixed(0)}K`;
      } else {
        precioFormateado = `$${valor}`;
      }
      
      // Si ya hay nombre de cliente, añadir el precio en nueva línea
      label = label ? `${label}\n${precioFormateado}` : precioFormateado;
    }
  }
  
  return label;
}

/**
 * Obtiene el texto principal para mostrar en una sugerencia de búsqueda
 * @param suggestion Objeto de sugerencia
 * @param searchType Tipo de búsqueda (nombre, rfc o dirección)
 * @returns Texto formateado para mostrar
 */
export function getSuggestionDisplayText(suggestion: ISuggestion, searchType: SearchType): string {
  switch (searchType) {
    case 'nombre':
      // Usar el nombreCliente si está disponible directamente
      if (suggestion.nombreCliente) return suggestion.nombreCliente;

      // Construir nombre completo con componentes individuales si están disponibles
      if (suggestion.nombre) {
        // Construir nombre completo con todos los componentes disponibles
        let nombreCompleto = suggestion.nombre;
        if (suggestion.apellidoPaterno) nombreCompleto += ` ${suggestion.apellidoPaterno}`;
        if (suggestion.apellidoMaterno) nombreCompleto += ` ${suggestion.apellidoMaterno}`;
        return nombreCompleto;
      }

      // Caso para empresas o personas morales
      if (suggestion.razonSocial) return `${suggestion.razonSocial}`;

      // Si tenemos un campo nombreDisplay (que puede haber sido creado en handleInputChange)
      if (suggestion.nombreDisplay) return suggestion.nombreDisplay;
      
      // Para clientes tipo persona física
      if (suggestion.tipoPersona === 'fisica') {
        let nombre = suggestion.nombre || '';
        if (suggestion.apellidoPaterno) nombre += ` ${suggestion.apellidoPaterno}`;
        if (suggestion.apellidoMaterno) nombre += ` ${suggestion.apellidoMaterno}`;
        if (nombre.trim()) return nombre;
      }

      // Para clientes tipo persona moral
      if (suggestion.tipoPersona === 'moral' && suggestion.razonSocial) {
        return suggestion.razonSocial;
      }

      // Si tiene clienteId pero no nombre, mostrar placeholder informativo pero más completo
      if (suggestion.clienteId) {
        // Si hay algún identificador de nombre disponible, usarlo
        if (suggestion.displayText) return suggestion.displayText;
        return `Cliente #${suggestion.clienteId} ${suggestion.rfc ? `(${suggestion.rfc})` : ''}`;
      }

      // Último caso de respaldo, usar cualquier campo que pueda indicar un nombre
      return suggestion.name || suggestion.cliente || suggestion.title ||
        `Cliente ${suggestion.clienteId || ''}`;
      
    case 'rfc':
      // Búsqueda por RFC con mejor formato y alternativas
      if (suggestion.rfc) {
        const rfc = suggestion.rfc.toUpperCase();
        
        // Si hay un displayText predefinido, usarlo (útil para autocompletado)
        if (suggestion.displayText) return suggestion.displayText;
        
        // Si hay nombre o razón social disponible, incluirlos con el RFC
        if (suggestion.nombre || suggestion.razonSocial) {
          const nombre = suggestion.razonSocial || 
                        (suggestion.nombre ? 
                          `${suggestion.nombre} ${suggestion.apellidoPaterno || ''} ${suggestion.apellidoMaterno || ''}`.trim() : 
                          '');
          return `${rfc} - ${nombre}`;
        }
        
        // Si solo tenemos RFC, mostrarlo con formato según tipo
        const tipoRfc = rfc.length === 13 ? "Persona Física" :
                        rfc.length === 12 ? "Persona Moral" : "";
        return tipoRfc ? `${rfc} (${tipoRfc})` : rfc;
      }
      
      // Casos de respaldo para cuando no hay RFC
      if (suggestion.isCliente) return `${suggestion.nombre || suggestion.razonSocial || 'Cliente'} (Sin RFC)`;
      if (suggestion.clienteId) return `Cliente ID: ${suggestion.clienteId}`;
      return 'RFC no disponible';
      
    case 'direccion':
      // Para búsqueda por dirección, mostrar solo la dirección
      if (suggestion.direccion) return suggestion.direccion;
      if (suggestion.domicilio) return suggestion.domicilio;
      
      // Construir dirección desde componentes si están disponibles
      if (suggestion.calle) {
        let direccionCompleta = suggestion.calle;
        if (suggestion.numeroExterior) direccionCompleta += ` #${suggestion.numeroExterior}`;
        if (suggestion.colonia) direccionCompleta += `, ${suggestion.colonia}`;
        return direccionCompleta;
      }
      return 'Dirección no disponible';
  }

  // Si no hay un valor específico para el tipo, usar un valor de respaldo inteligente
  return suggestion[searchType] || suggestion.id ? `ID #${suggestion.id}` : 'Sugerencia';
}

/**
 * Obtiene información secundaria para mostrar en una sugerencia de búsqueda
 * @param suggestion Objeto de sugerencia 
 * @param searchType Tipo de búsqueda (nombre, rfc o dirección)
 * @returns Texto formateado con información secundaria
 */
export function getSuggestionSecondaryInfo(suggestion: ISuggestion, searchType: SearchType): string {
  switch (searchType) {
    case 'nombre':
      // Información secundaria más completa para nombres
      const infoItems = [];

      // Agregar RFC si existe
      if (suggestion.rfc) infoItems.push(`RFC: ${suggestion.rfc.toUpperCase()}`);

      // Agregar ID del cliente
      if (suggestion.clienteId) infoItems.push(`ID: ${suggestion.clienteId}`);

      // Agregar estatus si existe
      if (suggestion.estatus) infoItems.push(`Estatus: ${suggestion.estatus}`);

      // Agregar dirección abreviada
      if (suggestion.direccion) {
        // Limitar dirección a 40 caracteres para mantenerlo compacto
        const direccionCorta = suggestion.direccion.length > 40
          ? suggestion.direccion.substring(0, 40) + '...'
          : suggestion.direccion;
        infoItems.push(direccionCorta);
      }

      return infoItems.join(' | ');

    case 'rfc':
      // Información secundaria más detallada para RFC
      const rfcInfoItems = [];

      // Mostrar tipo de persona basado en longitud del RFC o propiedad tipoPersona
      if (suggestion.rfc) {
        if (!suggestion.tipoPersona) {
          const tipoDeducido = suggestion.rfc.length === 13 ? 'fisica' : 
                              suggestion.rfc.length === 12 ? 'moral' : null;
          
          if (tipoDeducido) {
            rfcInfoItems.push(tipoDeducido === 'fisica' ? 'Persona Física' : 'Persona Moral');
          }
        }
      }
      
      // Dirección principal (si existe)
      if (suggestion.direccion) {
        const direccionCorta = suggestion.direccion.length > 40
          ? suggestion.direccion.substring(0, 40) + '...'
          : suggestion.direccion;
        rfcInfoItems.push(direccionCorta);
      }

      // Información de inmuebles
      if (typeof suggestion.cantidadInmuebles === 'number') {
        rfcInfoItems.push(`${suggestion.cantidadInmuebles} ${suggestion.cantidadInmuebles === 1 ? 'inmueble' : 'inmuebles'}`);
      } else if (suggestion.inmuebles && Array.isArray(suggestion.inmuebles)) {
        rfcInfoItems.push(`${suggestion.inmuebles.length} ${suggestion.inmuebles.length === 1 ? 'inmueble' : 'inmuebles'}`);
      }

      // Mostrar contacto (correo/teléfono) si está disponible
      if (suggestion.correo) rfcInfoItems.push(suggestion.correo);
      if (suggestion.telefono) rfcInfoItems.push(suggestion.telefono);

      // Si no hay información secundaria pero hay estatus, mostrarlo
      if (rfcInfoItems.length === 0 && suggestion.estatus) {
        rfcInfoItems.push(`Estatus: ${suggestion.estatus}`);
      }

      return rfcInfoItems.join(' | ');

    case 'direccion':
      // Información secundaria mejorada para direcciones
      const direccionInfo = [];

      // Mostrar cliente asociado
      if (suggestion.nombreCliente) direccionInfo.push(suggestion.nombreCliente);
      else if (suggestion.clienteId) direccionInfo.push(`Cliente ID: ${suggestion.clienteId}`);

      // Mostrar valor de mercado si está disponible
      if (suggestion.valorMercado) {
        const valor = Number(suggestion.valorMercado);
        if (!isNaN(valor)) {
          direccionInfo.push(`$${valor.toLocaleString()}`);
        }
      }

      // Mostrar estatus si existe
      if (suggestion.estatus) direccionInfo.push(`Estatus: ${suggestion.estatus}`);

      return direccionInfo.join(' | ');
  }

  return '';
}

/**
 * Determina si una sugerencia es válida para el tipo de búsqueda
 * @param suggestion Objeto de sugerencia
 * @param searchType Tipo de búsqueda
 * @returns true si la sugerencia tiene los campos necesarios para el tipo de búsqueda
 */
export function isValidSuggestion(suggestion: ISuggestion, searchType: SearchType): boolean {
  switch (searchType) {
    case 'nombre':
      return !!(suggestion.nombreCliente || suggestion.nombre || suggestion.razonSocial || suggestion.clienteId);
    case 'rfc':
      return !!(suggestion.rfc);
    case 'direccion':
      return !!(suggestion.direccion || suggestion.domicilio || suggestion.calle);
  }
  return false;
}