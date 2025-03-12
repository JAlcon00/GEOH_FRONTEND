import { ICliente } from './cliente.types';
import { IInmueble } from './inmueble.types';
import { IDocumento } from './documento.types';

export interface IFormularioGarantia {
    cliente: ICliente;
    inmueble: IInmueble;
    documentos: IDocumento[];
}