import React, { useEffect, useState } from 'react';
import { getInmueblesByCliente } from '../../services/inmueble.service';
import InmuebleCard from './inmuebleCard';

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

const InmuebleByCliente: React.FC<InmuebleByClienteProps> = ({ clienteId }) => {
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInmuebles = async () => {
      try {
        if (clienteId) {
          const data = await getInmueblesByCliente(clienteId);
          setInmuebles(data);
        }
      } catch (err) {
        console.error(err);
        setError('Error al obtener los inmuebles.');
      }
    };
    fetchInmuebles();
  }, [clienteId]);

  return (
    <div className="p-6">
      
      {error && <p className="text-red-500 text-center">{error}</p>}
      <div className="space-y-6">
        {inmuebles.map((inmueble) => (
          <InmuebleCard key={inmueble.id} {...inmueble} />
        ))}
      </div>
    </div>
  );
};

export default InmuebleByCliente;