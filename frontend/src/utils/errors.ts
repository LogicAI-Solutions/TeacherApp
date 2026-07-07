export function getApiErrorMessage(error: any, fallback = 'Ocorreu um erro inesperado.'): string {
    const detail = error?.response?.data?.detail;

    if (typeof detail === 'string' && detail.trim()) {
        return detail;
    }

    // 422 do FastAPI: detail é um array de erros de validação
    if (Array.isArray(detail)) {
        const messages = detail
            .map((d: any) => (typeof d === 'string' ? d : d?.msg))
            .filter(Boolean);
        if (messages.length) return messages.join('; ');
    }

    // Algum objeto inesperado em detail
    if (detail && typeof detail === 'object') {
        if (typeof detail.msg === 'string') return detail.msg;
    }

    // Erro de rede (sem response) ou mensagem genérica do axios
    if (!error?.response && typeof error?.message === 'string' && error.message) {
        return error.message;
    }

    return fallback;
}
