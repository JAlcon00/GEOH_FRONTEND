export type TipoDocumento = 'escritura' | 'libertad_gravamen' | 'avaluo' | 'fotografia';

export interface IDocumento {
    id?: number;
    tipoDocumento: TipoDocumento;
    archivo: File;
    inmuebleId?: number;
    estatus?: string;
}

declare global {
  interface Window {
    toast?: {
      success: (msg: string) => void;
      warning: (msg: string) => void;
      error: (msg: string) => void;
    };
  }
}

export {};