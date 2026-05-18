import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrai a mensagem de erro de uma HttpErrorResponse,
 * suportando corpos do tipo Blob (gerado pela API quando responseType='blob').
 *
 * Retorna uma Promise com a mensagem legível.
 */
export function extractErrorMessage(err: HttpErrorResponse, fallback = 'Erro inesperado. Tente novamente.'): Promise<string> {
  // Caso 1: corpo é um Blob (responseType='blob' no serviço gerado)
  if (err.error instanceof Blob) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        try {
          const json = JSON.parse(text);
          resolve(json.message ?? json.error ?? json.detail ?? text ?? fallback);
        } catch {
          resolve(text || fallback);
        }
      };
      reader.onerror = () => resolve(fallback);
      reader.readAsText(err.error as Blob);
    });
  }

  // Caso 2: corpo é um objeto JSON
  if (err.error && typeof err.error === 'object') {
    const msg = err.error.message ?? err.error.error ?? err.error.detail;
    if (msg) return Promise.resolve(msg);
  }

  // Caso 3: corpo é uma string
  if (typeof err.error === 'string' && err.error.trim()) {
    return Promise.resolve(err.error);
  }

  // Fallback: mensagem HTTP
  return Promise.resolve(err.message || fallback);
}
