'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy, KeyRound, LoaderCircle, MailPlus, ShieldCheck, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type Volunteer = {
  id: number;
  email: string;
  role: 'owner' | 'volunteer';
  active: boolean;
  created_at: string;
  password_activated_at: string | null;
  invite_expires_at: string | null;
};

type Invitation = { email: string; activationCode: string; expiresAt: string };

export function VolunteerAccess() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingEmail, setSavingEmail] = useState('');
  const [message, setMessage] = useState('');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    const response = await fetch('/api/volunteers', { cache: 'no-store' });
    const result = (await response.json()) as { volunteers?: Volunteer[]; error?: string };
    setLoading(false);
    if (!response.ok) {
      setMessage(result.error || 'Unable to load access.');
      return;
    }
    setVolunteers(result.volunteers || []);
  }

  useEffect(() => { void load(); }, []);

  async function issueCode(volunteerEmail: string) {
    setSavingEmail(volunteerEmail);
    setMessage('');
    setInvitation(null);
    setCopied(false);
    const response = await fetch('/api/volunteers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: volunteerEmail }),
    });
    const result = (await response.json()) as { volunteer?: Volunteer; activationCode?: string; expiresAt?: string; error?: string };
    setSavingEmail('');
    if (!response.ok || !result.activationCode || !result.expiresAt) {
      setMessage(result.error || 'A setup code could not be created.');
      return;
    }
    setEmail('');
    setInvitation({ email: volunteerEmail, activationCode: result.activationCode, expiresAt: result.expiresAt });
    await load();
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    await issueCode(email.trim().toLowerCase());
  }

  async function copyCode() {
    if (!invitation) return;
    await navigator.clipboard.writeText(invitation.activationCode);
    setCopied(true);
  }

  async function remove(volunteerEmail: string) {
    const response = await fetch('/api/volunteers', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: volunteerEmail }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(result.error || 'Access could not be removed.');
      return;
    }
    setInvitation(null);
    setMessage('Volunteer access removed.');
    await load();
  }

  return (
    <main className="min-h-screen bg-[#f4f1e8] text-[#171b21]">
      <header className="bg-[#171b21] text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <div><p className="font-black uppercase tracking-[0.1em]">Sikh Tactical</p><p className="text-xs uppercase tracking-[0.16em] text-white/50">Volunteer access</p></div>
          <a href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 hover:text-white"><ArrowLeft className="size-4" /> Dashboard</a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a7119]">Owner controls</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Manage volunteer logins</h1>
          <p className="mt-2 text-muted-foreground">Create a one-time setup code for each trusted volunteer. They choose their own password and do not need ChatGPT.</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MailPlus className="text-[#b17e13]" /> Add a volunteer</CardTitle>
            <CardDescription>Use the exact email address they will use to sign in.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field className="flex-1">
                <FieldLabel htmlFor="volunteer-email">Volunteer email</FieldLabel>
                <Input id="volunteer-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-11" />
              </Field>
              <Button type="submit" disabled={Boolean(savingEmail)} className="h-11 bg-[#d5a72f] text-[#171b21] hover:bg-[#e3b84a]">
                {savingEmail ? <LoaderCircle className="animate-spin" /> : <KeyRound />}{savingEmail ? 'Creating…' : 'Create setup code'}
              </Button>
            </form>

            {invitation && (
              <section className="mt-5 rounded-xl border border-[#d5a72f]/50 bg-[#fff9e8] p-4" aria-live="polite">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6814]">Copy this code now</p>
                <p className="mt-1 text-sm">Share it privately with <strong>{invitation.email}</strong>. It works once and expires in 7 days.</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="flex-1 rounded-lg bg-[#171b21] px-4 py-3 text-center text-lg font-bold tracking-widest text-white">{invitation.activationCode}</code>
                  <Button type="button" variant="outline" className="h-12" onClick={() => void copyCode()}>
                    {copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy code'}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-black/55">For security, the code will not be shown again after you leave this screen. Create a new one if it is lost.</p>
              </section>
            )}

            {message && <p role="status" className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
          </CardContent>
        </Card>

        <Card className="mt-6 border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Authorised accounts</CardTitle>
            <CardDescription>Create a new code if somebody loses theirs. Remove access immediately when it is no longer needed.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <p className="p-6 text-sm text-muted-foreground">Loading access…</p> : (
              <div className="divide-y">
                {volunteers.filter((volunteer) => volunteer.active).map((volunteer) => (
                  <div key={volunteer.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{volunteer.email}</p>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {volunteer.role} · {volunteer.password_activated_at ? 'Password active' : 'Setup required'}
                      </p>
                    </div>
                    {volunteer.role === 'owner' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><ShieldCheck className="size-4" /> Protected owner</span>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={Boolean(savingEmail)} onClick={() => void issueCode(volunteer.email)}>
                          {savingEmail === volunteer.email ? <LoaderCircle className="animate-spin" /> : <KeyRound />} New code
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => void remove(volunteer.email)}><UserMinus /> Remove</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
