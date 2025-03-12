import { IPersona } from './persona.types';


export interface IPersonaFisica extends IPersona {
    
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    fechaNacimiento: Date;
}

export interface IPersonaMoral extends IPersona {
    razonSocial: string;
    representanteLegal: string;
    fechaConstitucion: Date;
}

export type ICliente = IPersonaFisica | IPersonaMoral;

export type IClienteConTipo = ICliente & {
    tipoPersona: 'fisica' | 'moral';
};