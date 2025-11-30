import Link from 'next/link'
import { ByokInput } from '@/components/byok-input'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Council Chat</h1>
        <p className="text-xl text-muted-foreground">Foundation Setup Complete</p>
      </div>

      <ByokInput />

      <div className="flex gap-4">
        <Button asChild>
            <Link href="/login">Login / Sign Up</Link>
        </Button>
      </div>
    </main>
  );
}
