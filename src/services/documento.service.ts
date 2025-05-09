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
        file?: File | null,
        tipoDocumento?: string,
        estatus?: string
    ): Promise<any> {
        try {
            const formData = new FormData();
            
            // Solo agregar el archivo si se proporciona uno
            if (file) {
                formData.append('file', file);
            }
            
            if (tipoDocumento) {
                formData.append('tipoDocumento', tipoDocumento);
            }
            
            if (estatus) {
                formData.append('estatus', estatus);
            }
            
            // Si no hay archivo pero hay otros cambios, usar un enfoque diferente
            if (!file && (tipoDocumento || estatus)) {
                // Usar JSON para actualizar solo los metadatos
                const data: any = {};
                if (tipoDocumento) data.tipoDocumento = tipoDocumento;
                if (estatus) data.estatus = estatus;
                
                const response = await api.put(`/documentos/${id}/metadata`, data);
                return response.data;
            }
        
            // Si hay archivo, hacer la solicitud multipart/form-data
            const response = await api.put(`/documentos/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        
            return response.data;
        } catch (error: any) {
            console.error('Error en actualizarDocumento:', error);
            
            // Capturar mensaje específico del servidor si está disponible
            const errorMessage = error.response?.data?.message || 
                                'Error al actualizar el documento';
            
            throw {
                message: errorMessage,
                originalError: error,
                status: error.response?.status
            };
        }
    }

    async actualizarEstatusDocumento(id: number, estatus: string): Promise<any> {
        const response = await api.put(`/documentos/${id}/estatus`, { estatus });
        return response.data;
    }

}

export default new DocumentoService();