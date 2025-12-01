export const AppConfig = {
    name: 'Council Chat',
    version: '1.0.0',
    api: {
        baseUrl: '/api',
        endpoints: {
            chat: '/chat',
            models: '/models',
            councils: '/councils',
        }
    },
    defaultUser: {
        id: 'local-user',
        email: 'local@user.com',
        name: 'Local User'
    },
    features: {
        councilMode: true,
        analytics: true
    }
} as const;
