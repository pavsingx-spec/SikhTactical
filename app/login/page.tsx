'use client';

import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { KeyRound, LoaderCircle, LockKeyhole, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

type Mode = 'signin' | 'setup';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage('');
    setPassword('');
    setConfirmPassword('');
    setActivationCode('');
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      setMessage('The email or password is incorrect. If this is your first visit, use First-time setup.');
      return;
    }
    window.location.assign('/admin');
  }

  async function activate(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (password !== confirmPassword) {
      setMessage('The two passwords do not match.');
      return;
    }

    setLoading(true);
    const response = await fetch('/api/auth/activate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), activationCode, password }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setLoading(false);
      setMessage(result.error || 'Your password could not be set.');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      setMessage('Your password was set. Switch to Sign in and enter it again.');
      return;
    }
    window.location.assign('/admin');
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#171b21] px-5 py-12 text-white">
      <div className="w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          <Image src="/sikh-tactical-logo.png" alt="Sikh Tactical" width={64} height={64} className="size-16 rounded-xl object-cover" priority />
          <div>
            <p className="text-xl font-black uppercase tracking-[0.09em]">Sikh Tactical</p>
            <p className="text-xs uppercase tracking-[0.16em] text-white/55">Participant operations</p>
          </div>
        </div>

        <Card className="border-0 bg-white text-[#171b21] shadow-2xl ring-0">
          <CardHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-[#d5a72f]"><LockKeyhole /></div>
            <CardTitle className="text-2xl font-black">Volunteer access</CardTitle>
            <CardDescription>Only approved volunteers can view participant and emergency information.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid grid-cols-2 rounded-xl bg-[#f0eee8] p-1" aria-label="Choose sign-in method">
              <button type="button" onClick={() => changeMode('signin')} className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${mode === 'signin' ? 'bg-white shadow-sm' : 'text-black/55'}`}>
                Sign in
              </button>
              <button type="button" onClick={() => changeMode('setup')} className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${mode === 'setup' ? 'bg-white shadow-sm' : 'text-black/55'}`}>
                First-time setup
              </button>
            </div>

            {mode === 'signin' ? (
              <form onSubmit={signIn} className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="signin-email">Volunteer email</FieldLabel>
                  <Input id="signin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="h-11" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="signin-password">Password</FieldLabel>
                  <Input id="signin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className="h-11" />
                </Field>
                <Button type="submit" disabled={loading} className="h-11 w-full bg-[#171b21] text-white">
                  {loading ? <LoaderCircle className="animate-spin" /> : <LogIn />}{loading ? 'Signing in…' : 'Sign in securely'}
                </Button>
              </form>
            ) : (
              <form onSubmit={activate} className="space-y-4">
                <p className="rounded-lg border border-[#d5a72f]/35 bg-[#fff9e8] p-3 text-sm leading-5 text-black/70">
                  Ask the owner for your one-time setup code. No email link or ChatGPT account is needed.
                </p>
                <Field>
                  <FieldLabel htmlFor="setup-email">Approved email</FieldLabel>
                  <Input id="setup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="h-11" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="activation-code">One-time setup code</FieldLabel>
                  <Input id="activation-code" value={activationCode} onChange={(event) => setActivationCode(event.target.value.toUpperCase())} required autoComplete="one-time-code" placeholder="XXXXXX-XXXXXX-XXXXXX" className="h-11 font-mono uppercase tracking-wider" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="setup-password">Create password</FieldLabel>
                  <Input id="setup-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} maxLength={72} autoComplete="new-password" className="h-11" />
                  <p className="text-xs text-muted-foreground">Use at least 12 characters.</p>
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={12} maxLength={72} autoComplete="new-password" className="h-11" />
                </Field>
                <Button type="submit" disabled={loading} className="h-11 w-full bg-[#171b21] text-white">
                  {loading ? <LoaderCircle className="animate-spin" /> : <KeyRound />}{loading ? 'Setting password…' : 'Set password and sign in'}
                </Button>
              </form>
            )}

            {message && <p role="status" className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
          </CardContent>
        </Card>
        <p className="mt-5 text-center text-xs text-white/45">Participant data is private and should only be accessed for approved Sikh Tactical activities.</p>
      </div>
    </main>
  );
}
