export type TipoDocumento = 'escritura' | 'libertad_gravamen' | 'avaluo' | 'fotografia';

export interface IDocumento {
    id?: number;
    tipoDocumento: TipoDocumento;
    archivo: File;
    inmuebleId?: number;
    estatus?: string;
}