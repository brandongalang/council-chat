'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
                    <div className="p-4 bg-destructive/10 rounded-full">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
                    <p className="text-muted-foreground max-w-md">
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
