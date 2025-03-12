export interface IInmueble {
    id?: number;
    direccion: string;
    valorMercado: number;
    foto?: File | null;
    clienteId?: number;
}