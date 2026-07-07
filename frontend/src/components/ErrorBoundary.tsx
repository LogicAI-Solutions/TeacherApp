import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: unknown) {
        // Mantém o rastro no console para diagnóstico
        console.error('Erro de renderização capturado pelo ErrorBoundary:', error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-[70vh] flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                    <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle size={48} className="text-danger" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white mb-2">Algo quebrou nesta tela</h2>
                    <p className="text-text-muted mb-6 leading-relaxed">
                        Ocorreu um erro inesperado ao exibir esta página. Suas informações não foram perdidas.
                    </p>
                    {this.state.error && (
                        <pre className="text-left text-xs text-danger/80 bg-danger/5 border border-danger/20 rounded-xl p-4 mb-8 max-w-full overflow-x-auto whitespace-pre-wrap">
                            {this.state.error.message}
                        </pre>
                    )}
                    <button
                        onClick={this.handleReset}
                        className="glass-button text-white font-bold flex items-center gap-2 px-6 py-3 rounded-xl"
                    >
                        <RefreshCw size={18} /> Tentar Novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
