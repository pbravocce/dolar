import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <div className="card max-w-sm text-center">
            <p className="text-lg font-semibold text-slate-800">Algo salió mal</p>
            <p className="mt-1 text-sm text-slate-500">
              Se rompió la pantalla. Recarga para continuar.
            </p>
            <button className="btn-primary mt-4 w-full" onClick={this.handleReload}>
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}