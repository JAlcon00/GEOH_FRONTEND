import React, { useEffect, useState, useCallback, memo } from 'react';
import { getInmueblesByCliente } from '../../services/inmueble.service';
import InmuebleCard from './inmuebleCard';
import { FixedSizeList as List } from 'react-window';

interface Inmueble {
  id: number;
  clienteId: number;
  direccion: string;
  valorMercado: number;
  foto?: string;
  estatus: string;
}

interface InmuebleByClienteProps {
  clienteId: number;
}

const InmuebleByCliente: React.FC<InmuebleByClienteProps> = memo(({ clienteId }) => {
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchInmuebles = useCallback(async () => {
    if (!clienteId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await getInmueblesByCliente(clienteId);
      setInmuebles(data);
    } catch (err) {
      console.error(err);
      setError('Error al obtener los inmuebles.');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    fetchInmuebles();
  }, [fetchInmuebles]);

  // Componente de ítem para la lista virtualizada
  const InmuebleItem = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const inmueble = inmuebles[index];
    return (
      <div style={style}>
        <InmuebleCard key={inmueble.id} {...inmueble} />
      </div>
    );
  });

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Inmuebles del Cliente</h3>
      
      {loading && <p className="text-center text-gray-500">Cargando inmuebles...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}
      
      {!loading && !error && inmuebles.length === 0 && (
        <p className="text-center text-gray-500">Este cliente no tiene inmuebles registrados.</p>
      )}
      
      {!loading && !error && inmuebles.length > 0 && (
        inmuebles.length > 10 ? (
          // Usa virtualización para listas grandes
          <List
            height={500}
            itemCount={inmuebles.length}
            itemSize={150}
            width="100%"
          >
            {InmuebleItem}
          </List>
        ) : (
          // Renderizado normal para pocas tarjetas
          <div className="space-y-6">
            {inmuebles.map((inmueble) => (
              <InmuebleCard key={inmueble.id} {...inmueble} />
            ))}
          </div>
        )
      )}
    </div>
  );
});

export default InmuebleByCliente;