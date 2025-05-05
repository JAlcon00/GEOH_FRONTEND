import api from './api';

class DocumentoService {
    // Método para subir un documento
    async subirDocumento(file: File, inmuebleId: number, tipoDocumento: string): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('inmuebleId', inmuebleId.toString());
        formData.append('tipoDocumento', tipoDocumento);

        const response = await api.post('/documentos', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    }

    // Método para subir múltiples documentos
    async subirMultiplesDocumentos(files: File[], inmuebleId: number, tipoDocumento: string): Promise<any> {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('inmuebleId', inmuebleId.toString());
        formData.append('tipoDocumento', tipoDocumento);

        const response = await api.post('/documentos/multi', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    }

    // Método para obtener un documento por su ID
    async obtenerDocumento(id: number): Promise<any> {
        const response = await api.get(`/documentos/${id}`);
        return response.data;
    }

    // Método para obtener documentos por inmueble
    async obtenerDocumentosPorInmueble(inmuebleId: number): Promise<any> {
        const response = await api.get(`/documentos/inmueble/${inmuebleId}`);
        return response.data;
    }

    // Método para eliminar un documento por su ID
    async eliminarDocumento(id: number): Promise<void> {
        try {
            await api.delete(`/documentos/${id}`);
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 404) {
                // Permitir manejar el 404 en el componente (no lanzar error)
                throw { status: 404, message: 'El documento ya no existe' };
            }
            throw err;
        }
    }

    // Método para actualizar un documento por su ID
    async actualizarDocumento(
        id: number,
        file: File,
        tipoDocumento?: string,
        estatus?: string
    ): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);
        if (tipoDocumento) {
            formData.append('tipoDocumento', tipoDocumento);
        }
        // Agregar el estatus en caso de que se envíe
        if (estatus) {
            formData.append('estatus', estatus);
        }
    
        const response = await api.put(`/documentos/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    
        return response.data;
    }

    async actualizarEstatusDocumento(id: number, estatus: string): Promise<any> {
        const response = await api.put(`/documentos/${id}/estatus`, { estatus });
        return response.data;
    }

}

export default new DocumentoService();