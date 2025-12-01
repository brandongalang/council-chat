import { redirect } from 'next/navigation'

/**
 * Landing page component.
 * Redirects directly to the chat interface in local-only mode.
 *
 * @returns Redirects to /chat
 */
export default function Home() {
  redirect('/chat');
}
