'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

/**
 * Component for managing the User's OpenAI API Key locally (BYOK).
 * Stores the key in LocalStorage and never sends it to the server unencrypted.
 *
 * @returns The BYOK Input component.
 */
export function ByokInput() {
  const [key, setKey] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('openai_api_key')
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKey(stored)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(true)
    }
  }, [])

  const handleSave = () => {
    if (!key.trim()) {
        handleClear()
        return
    }
    localStorage.setItem('openai_api_key', key.trim())
    setSaved(true)
  }

  const handleClear = () => {
    localStorage.removeItem('openai_api_key')
    setKey('')
    setSaved(false)
  }

  return (
    <div className="w-full max-w-sm space-y-2">
      <Label htmlFor="api-key">OpenAI API Key (Stored Locally)</Label>
      <div className="flex w-full items-center space-x-2">
        <div className="relative w-full">
            <Input
            id="api-key"
            type={isVisible ? 'text' : 'password'}
            placeholder="sk-..."
            value={key}
            onChange={(e) => {
                setKey(e.target.value)
                setSaved(false)
            }}
            />
            <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setIsVisible(!isVisible)}
            >
                {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
        <Button type="button" onClick={handleSave} disabled={saved}>
          {saved ? 'Saved' : 'Save'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Your key is stored in your browser&apos;s local storage and never sent to our servers unencrypted.
      </p>
    </div>
  )
}
