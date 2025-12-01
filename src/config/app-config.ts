/**
 * Application configuration for local-only mode.
 * No Supabase authentication required - uses a hardcoded local user.
 */
export const AppConfig = {
  defaultUser: {
    id: 'local-user-1',
    email: 'user@localhost',
    name: 'Local User',
  },
  mode: 'local' as const,
};
