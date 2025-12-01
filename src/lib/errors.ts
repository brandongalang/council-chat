import { NextResponse } from 'next/server';

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function handleError(error: unknown) {
    console.error('API Error:', error);

    if (error instanceof AppError) {
        return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.statusCode }
        );
    }

    return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
    );
}
