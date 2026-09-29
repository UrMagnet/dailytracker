'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  // Already signed in (or the magic link just landed here) — go straight in.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace('/dashboard')
    })
    return () => sub.subscription.unsubscribe()
  }, [router])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      // Only existing (paid) accounts can sign in — the webhook creates the
      // account after payment, so no self-signup from this form.
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) {
      setStatus('error')
      setError(
        error.message.toLowerCase().includes('signups not allowed')
          ? 'Email ini belum terdaftar. Pastikan kamu memakai email yang dipakai saat membeli.'
          : error.message,
      )
      return
    }
    setStatus('sent')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          ✅ Daily Tracker
        </Link>
        <h1 className="mt-4 text-lg font-semibold">Masuk ke akunmu</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Pakai email yang kamu gunakan saat membeli akses. Kami kirimkan link masuk — tidak perlu
          password.
        </p>

        {status === 'sent' ? (
          <div className="mt-4 rounded-xl bg-indigo-600/10 px-3 py-3 text-sm text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">
            <p>
              Link masuk sudah dikirim ke <strong>{email}</strong>. Buka email itu untuk lanjut ke
              dashboard.
            </p>
            <button
              className="mt-2 text-xs font-medium underline"
              onClick={() => setStatus('idle')}
            >
              Pakai email lain
            </button>
          </div>
        ) : (
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                className="field"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {status === 'error' && <p className="text-sm text-rose-500">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={status === 'sending'}>
              {status === 'sending' ? 'Mengirim link…' : 'Kirim link masuk'}
            </button>
          </form>
        )}
      </div>

      <p className="mt-5 text-sm text-neutral-500 dark:text-neutral-400">
        Belum punya akses?{' '}
        <Link href="/checkout" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Beli sekarang — Rp20.000
        </Link>
      </p>
    </div>
  )
}
