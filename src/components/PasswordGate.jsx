import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Lock, X } from 'lucide-react'
import { verifyPassword } from '#/lib/crypto'
import { PASSWORD_HASH } from '#/config/constants'
import { useApp } from '#/context/AppContext'

export default function PasswordGate() {
  const { triesRemaining, isUnlocked, unlock } = useApp()
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(true)
  const [shaking, setShaking] = useState(false)

  if (isUnlocked || triesRemaining > 0) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await verifyPassword(input, PASSWORD_HASH)
    if (ok) {
      unlock()
      setOpen(false)
    } else {
      setError(true)
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-card rounded-2xl p-6 sm:p-8 shadow-2xl ${shaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-destructive/10">
              <Lock className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <Dialog.Title className="text-xl font-bold text-card-foreground">Free Trials Exhausted</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Enter the password to continue using the dashboard.
              </Dialog.Description>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false) }}
              placeholder="Enter password"
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3"
              autoFocus
            />
            {error && (
              <p className="text-destructive text-sm mb-3 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Incorrect password. Try again.
              </p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Unlock
            </button>
          </form>
          <Dialog.Close className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="w-4 h-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) translate(-50%, -50%); }
          20% { transform: translateX(-8px) translate(-50%, -50%); }
          40% { transform: translateX(8px) translate(-50%, -50%); }
          60% { transform: translateX(-6px) translate(-50%, -50%); }
          80% { transform: translateX(6px) translate(-50%, -50%); }
        }
      `}</style>
    </Dialog.Root>
  )
}
