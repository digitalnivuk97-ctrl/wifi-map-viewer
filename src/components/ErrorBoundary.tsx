/**
 * Error Boundary component to catch React errors
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';
import './ErrorBoundary.css';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error details
        logger.error('React Error Boundary caught an error', error);
        logger.error(`Component stack: ${errorInfo.componentStack}`);
        
        this.setState({
            errorInfo
        });
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <div className="error-boundary-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        
                        <h1>Something went wrong</h1>
                        
                        <p className="error-message">
                            The application encountered an unexpected error. 
                            You can try to continue or reload the application.
                        </p>

                        {this.state.error && (
                            <details className="error-details">
                                <summary>Error Details</summary>
                                <div className="error-details-content">
                                    <p><strong>Error:</strong> {this.state.error.message}</p>
                                    {this.state.error.stack && (
                                        <pre className="error-stack">
                                            {this.state.error.stack}
                                        </pre>
                                    )}
                                    {this.state.errorInfo && (
                                        <pre className="error-stack">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            </details>
                        )}

                        <div className="error-boundary-actions">
                            <button 
                                className="button button-secondary"
                                onClick={this.handleReset}
                            >
                                Try to Continue
                            </button>
                            <button 
                                className="button button-primary"
                                onClick={this.handleReload}
                            >
                                Reload Application
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
