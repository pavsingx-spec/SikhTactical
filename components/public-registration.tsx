'use client';

import Image from 'next/image';
import QRCode from 'qrcode';
import { FormEvent, useState } from 'react';
import { CheckCircle2, Compass, Download, Flag, LoaderCircle, LockKeyhole, Mountain, QrCode, Route, ShieldCheck, UserPlus } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type RegistrationResult = { fullName: string; registrationId: string };

export function PublicRegistration({ adminSignInPath }: { adminSignInPath: string }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState<RegistrationResult | null>(null);
  const [qrImage, setQrImage] = useState('');

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError('');
    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...data, consent: data.consent === 'on' }),
      });
      const result = await response.json() as { participant?: RegistrationResult; error?: string };
      if (!response.ok || !result.participant) throw new Error(result.error || 'Registration could not be saved.');

      const qr = await QRCode.toDataURL(result.participant.registrationId, {
        width: 320,
        margin: 1,
        color: { dark: '#171b21', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      setRegistered(result.participant);
      setQrImage(qr);
      form.reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Registration could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#101419] text-[#171b21]">
      <header className="border-b border-white/10 bg-[#101419] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/sikh-tactical-logo.png" alt="Sikh Tactical" width={56} height={56} className="size-12 rounded-lg object-cover sm:size-14" priority />
            <div><p className="text-lg font-black uppercase tracking-[0.09em]">Sikh Tactical</p><p className="text-xs uppercase tracking-[0.16em] text-white/55">Participant registration</p></div>
          </div>
          <a href={adminSignInPath} target="_top" className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
            <LockKeyhole className="size-4" /><span className="hidden sm:inline">Volunteer sign in</span><span className="sm:hidden">Sign in</span>
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(213,167,47,0.16),transparent_32%),linear-gradient(135deg,#101419_0%,#1b2228_55%,#101419_100%)]" />
        <div className="absolute -right-24 top-12 size-72 rotate-12 border border-[#d5a72f]/15" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d5a72f]/40 bg-[#d5a72f]/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#f0c95e]"><Compass className="size-4" /> Your next challenge starts here</div>
            <h1 className="mt-6 max-w-xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] sm:text-6xl">Step beyond<br /><span className="text-[#d5a72f]">the ordinary.</span></h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/68 sm:text-lg">Join a Sikh Tactical experience built around outdoor challenge, teamwork and disciplined personal growth.</p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/75">
              <span className="flex items-center gap-2 rounded-md border border-white/12 bg-white/6 px-3 py-2"><Mountain className="size-4 text-[#d5a72f]" /> Outdoor skills</span>
              <span className="flex items-center gap-2 rounded-md border border-white/12 bg-white/6 px-3 py-2"><Route className="size-4 text-[#d5a72f]" /> Team challenge</span>
              <span className="flex items-center gap-2 rounded-md border border-white/12 bg-white/6 px-3 py-2"><Flag className="size-4 text-[#d5a72f]" /> Personal growth</span>
            </div>
            <a href="#registration" className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-[#d5a72f] px-5 text-sm font-black uppercase tracking-[0.12em] text-[#101419] transition hover:-translate-y-0.5 hover:bg-[#e6bb49]">Secure your place <Compass className="size-4" /></a>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rotate-2 border border-[#d5a72f]/25" />
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#20272d] shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
              <Image src="/og.png" alt="Sikh Tactical outdoor adventure experience" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" priority />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f0c95e]">Registration open</p><p className="mt-1 text-sm font-semibold text-white/85">Prepare. Participate. Progress.</p></div>
                <div className="flex size-10 items-center justify-center rounded-full bg-[#d5a72f] text-[#101419]"><Mountain className="size-5" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="registration" className="bg-[#f2efe5]">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-16">
        <section>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a7119]">Event registration</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">Secure your place</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#62666c]">Complete the form before arrival. Your details stay private and are visible only to the authorised Sikh Tactical administrator.</p>

          {registered ? (
            <Card className="mt-8 border-0 border-l-4 border-l-[#d5a72f] bg-white shadow-[0_18px_50px_rgba(23,27,33,0.12)] ring-black/5">
              <CardContent className="p-6 text-center sm:p-9">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-7" /></div>
                <h2 className="mt-4 text-2xl font-black">Registration complete</h2>
                <p className="mt-2 text-muted-foreground">Thank you, {registered.fullName}. Save this QR pass and show it when you arrive.</p>
                {qrImage && <img src={qrImage} alt={`QR registration pass for ${registered.fullName}`} className="mx-auto mt-6 size-60 rounded-xl border bg-white p-2" />}
                <p className="mt-3 font-mono text-sm font-bold">{registered.registrationId}</p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <a href={qrImage} download={`${registered.registrationId}-sikh-tactical-pass.png`} className={cn(buttonVariants({ size: 'lg' }), 'h-11 bg-[#171b21] px-5 text-white hover:bg-[#242a32]')}><Download /> Save QR pass</a>
                  <Button variant="outline" size="lg" className="h-11" onClick={() => { setRegistered(null); setQrImage(''); }}>Register another person</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-8 border-0 border-t-4 border-t-[#d5a72f] bg-white shadow-[0_18px_50px_rgba(23,27,33,0.12)] ring-black/5">
              <CardHeader className="border-b border-black/8"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-[#171b21] text-[#d5a72f]"><Compass className="size-5" /></div><div><CardTitle className="text-xl font-black uppercase tracking-tight">Participant details</CardTitle><CardDescription>Fields marked with * are required.</CardDescription></div></div></CardHeader>
              <CardContent className="p-5 sm:p-7">
                <form onSubmit={submitRegistration}>
                  <FieldGroup>
                    <FieldSet><FieldLegend>About you</FieldLegend><div className="grid gap-4 sm:grid-cols-2"><PublicField name="fullName" label="Full name" required /><PublicField name="mobile" label="Mobile number" type="tel" required /><PublicField name="email" label="Email address" type="email" /><PublicField name="dateOfBirth" label="Date of birth" type="date" /></div></FieldSet>
                    <FieldSet><FieldLegend>Home address</FieldLegend><div className="grid gap-4 sm:grid-cols-2"><PublicField name="addressLine1" label="Address line 1" required /><PublicField name="addressLine2" label="Address line 2" /><PublicField name="city" label="Town or city" required /><PublicField name="postcode" label="Postcode" required /></div></FieldSet>
                    <FieldSet><FieldLegend>Emergency contact</FieldLegend><div className="grid gap-4 sm:grid-cols-2"><PublicField name="emergencyName" label="Contact name" required /><PublicField name="emergencyPhone" label="Contact number" type="tel" required /><Field><FieldLabel htmlFor="emergencyRelationship">Relationship *</FieldLabel><NativeSelect className="w-full" name="emergencyRelationship" id="emergencyRelationship" required defaultValue=""><NativeSelectOption value="" disabled>Select relationship</NativeSelectOption><NativeSelectOption value="Parent">Parent</NativeSelectOption><NativeSelectOption value="Spouse or partner">Spouse or partner</NativeSelectOption><NativeSelectOption value="Sibling">Sibling</NativeSelectOption><NativeSelectOption value="Friend">Friend</NativeSelectOption><NativeSelectOption value="Other">Other</NativeSelectOption></NativeSelect></Field><Field><FieldLabel htmlFor="medicalNotes">Medical or accessibility notes</FieldLabel><Textarea id="medicalNotes" name="medicalNotes" maxLength={1000} placeholder="Optional—only details needed in an emergency" /></Field></div></FieldSet>
                    <div className="sr-only" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
                    <label className="flex gap-3 rounded-xl border border-[#d9d2bf] bg-[#faf8f1] p-4 text-sm"><input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-[#171b21]" /><span><strong className="block">Consent to store these details *</strong><span className="text-muted-foreground">I agree that Sikh Tactical may use this information for event administration, attendance and emergency support.</span></span></label>
                  </FieldGroup>
                  {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
                  <Button type="submit" disabled={saving} size="lg" className="mt-6 h-12 w-full bg-[#d5a72f] text-base font-black uppercase tracking-[0.08em] text-[#171b21] hover:bg-[#e2b743]">
                    {saving ? <LoaderCircle className="animate-spin" /> : <UserPlus />}{saving ? 'Saving registration…' : 'Complete registration'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </section>

        <aside className="space-y-4 lg:pt-24">
          <div className="rounded-2xl bg-[#171b21] p-6 text-white shadow-[0_18px_50px_rgba(23,27,33,0.18)]"><ShieldCheck className="size-8 text-[#d5a72f]" /><h2 className="mt-4 text-xl font-black uppercase tracking-tight">Your details stay protected</h2><p className="mt-3 text-sm leading-6 text-white/65">Participant and emergency information never appears on the public page. Only the authorised administrator can open the control dashboard.</p></div>
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a7119]">Your route to check-in</p>
            <div className="mt-5 space-y-5">
              <AdventureStep icon={<UserPlus />} number="01" title="Register" text="Complete your details securely." />
              <AdventureStep icon={<QrCode />} number="02" title="Save your pass" text="Keep the QR code on your phone." />
              <AdventureStep icon={<Flag />} number="03" title="Arrive ready" text="A volunteer scans you in within seconds." />
            </div>
          </div>
        </aside>
      </div>
      </section>
    </main>
  );
}

function PublicField({ name, label, type = 'text', required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return <Field><FieldLabel htmlFor={name}>{label}{required && ' *'}</FieldLabel><Input id={name} name={name} type={type} required={required} maxLength={type === 'email' ? 254 : 160} /><FieldDescription>{required ? 'Required' : 'Optional'}</FieldDescription></Field>;
}

function AdventureStep({ icon, number, title, text }: { icon: React.ReactNode; number: string; title: string; text: string }) {
  return <div className="grid grid-cols-[40px_1fr] gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-[#f3ead2] text-[#8b6513]">{icon}</div><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9a7119]">Step {number}</p><p className="font-black uppercase tracking-tight">{title}</p><p className="mt-0.5 text-sm text-muted-foreground">{text}</p></div></div>;
}

