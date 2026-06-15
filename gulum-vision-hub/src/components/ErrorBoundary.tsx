import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Something went wrong</h1>
          <p className="text-muted-foreground text-sm mb-4">{this.state.error.message}</p>
          <button
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
            onClick={() => { this.setState({ error: null }); window.location.href = "/"; }}
          >
            Go to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
