'use client';

import Image from 'next/image';
import QRCode from 'qrcode';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { FormEvent, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, LoaderCircle, LogOut, MapPin, Phone, QrCode, Search, Settings, ShieldCheck, UserPlus, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';

type Participant = {
  id: number; registrationId: string; fullName: string; mobile: string; email: string | null;
  dateOfBirth: string | null; addressLine1: string; addressLine2: string | null; city: string;
  postcode: string; emergencyName: string; emergencyPhone: string; emergencyRelationship: string;
  medicalNotes: string | null; createdAt: string; checkedInAt: string | null;
};

export function RegistrationDashboard({ volunteerName }: { volunteerName: string }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selected, setSelected] = useState<Participant | null>(null);
  const [qrImage, setQrImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);

  const stopScanner = () => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    void fetch('/api/participants', { cache: 'no-store' }).then(async (response) => {
      const data = await response.json() as { participants?: Participant[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'Unable to load participant records.');
      setParticipants(data.participants || []);
    }).catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load participant records.')).finally(() => setLoading(false));
  }, []);
  useEffect(() => () => stopScanner(), []);
  useEffect(() => {
    if (!selected) { setQrImage(''); return; }
    void QRCode.toDataURL(selected.registrationId, { width: 280, margin: 1, color: { dark: '#171b21', light: '#ffffff' }, errorCorrectionLevel: 'M' }).then(setQrImage);
  }, [selected]);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return needle ? participants.filter((p) => [p.fullName, p.mobile, p.registrationId].some((value) => value.toLowerCase().includes(needle))) : participants;
  }, [participants, query]);
  const checkedIn = participants.filter((p) => p.checkedInAt).length;

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('/api/participants', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...data, consent: data.consent === 'on' }) });
    const result = await response.json() as { participant?: Participant; error?: string };
    setSaving(false);
    if (!response.ok || !result.participant) { setError(result.error || 'Registration could not be saved.'); return; }
    setParticipants((current) => [result.participant!, ...current]); setRegistrationOpen(false); setSelected(result.participant);
  }

  async function checkIn(code: string) {
    setScanMessage('Checking registration…');
    const response = await fetch('/api/check-in', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ registrationId: code }) });
    const result = await response.json() as { participant?: Participant; error?: string };
    if (!response.ok || !result.participant) { setScanMessage(result.error || 'Check-in failed.'); return; }
    setParticipants((current) => current.map((p) => p.id === result.participant!.id ? result.participant! : p));
    setSelected((current) => current?.id === result.participant!.id ? result.participant! : current);
    setScanMessage(`${result.participant.fullName} is checked in.`); setScanCode(result.participant.registrationId); stopScanner();
  }

  async function startScanner() {
    setScanMessage('');
    stopScanner();
    try {
      if (!videoRef.current) throw new Error('Camera preview is unavailable.');
      const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 250 });
      scannerControlsRef.current = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result) void checkIn(result.getText());
      });
      setScanMessage('Camera ready—hold the QR code inside the frame.');
    } catch { setScanMessage('Camera access was unavailable. Check browser permission or enter the registration ID below.'); stopScanner(); }
  }

  async function signOut() {
    stopScanner();
    await createClient().auth.signOut();
    window.location.href = '/login';
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-[#171b21] text-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8"><div className="flex items-center gap-3"><Image src="/sikh-tactical-logo.png" alt="Sikh Tactical" width={52} height={52} className="h-12 w-12 rounded-lg object-cover" priority /><div><p className="text-lg font-black uppercase tracking-[0.09em]">Sikh Tactical</p><p className="text-xs uppercase tracking-[0.16em] text-white/55">Participant operations</p></div></div><div className="flex items-center gap-2"><a href="/admin/volunteers" className="inline-flex items-center gap-2 rounded-lg p-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white md:px-3" aria-label="Manage volunteer access"><Settings className="size-4" /><span className="hidden md:inline">Manage access</span></a><div className="text-right"><Badge className="hidden border border-white/15 bg-white/8 text-white sm:inline-flex"><ShieldCheck /> Private volunteer access</Badge><p className="mt-1 hidden max-w-56 truncate text-xs text-white/45 sm:block">{volunteerName}</p></div><Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={() => void signOut()} aria-label="Sign out"><LogOut /></Button></div></div></header>
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow">Live attendance</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Event check-in</h1><p className="mt-2 max-w-2xl text-muted-foreground">Register participants, scan arrival passes and keep emergency information ready for authorised volunteers.</p></div><div className="flex flex-col gap-3 sm:flex-row"><Button variant="outline" size="lg" className="h-11 px-4" onClick={() => { setScannerOpen(true); setScanMessage(''); }}><QrCode /> Scan participant</Button><Button size="lg" className="h-11 bg-[#d5a72f] px-4 text-[#171b21] hover:bg-[#e3b84a]" onClick={() => { setRegistrationOpen(true); setError(''); }}><UserPlus /> New registration</Button></div></section>
        {error && <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertTriangle className="size-5 shrink-0" />{error}</div>}
        <section className="grid gap-4 sm:grid-cols-3"><StatCard icon={<Users />} label="Registered" value={String(participants.length)} note="Participant records" /><StatCard icon={<CheckCircle2 />} label="Checked in" value={String(checkedIn)} note={participants.length ? `${Math.round((checkedIn / participants.length) * 100)}% attendance` : 'No arrivals yet'} /><StatCard icon={<CalendarDays />} label="Expected" value={String(participants.length - checkedIn)} note="Still to arrive" /></section>
        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.75fr)]">
          <Card className="border-0 shadow-[0_16px_40px_rgba(23,27,33,0.08)] ring-black/6"><CardHeader className="border-b border-border/70 pb-4 sm:grid-cols-[1fr_minmax(240px,320px)]"><div><CardTitle className="text-xl font-bold">Participants</CardTitle><CardDescription>Search by name, mobile number or registration ID.</CardDescription></div><div className="relative mt-3 sm:mt-0"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-10 bg-muted/50 pl-9" placeholder="Search participants" aria-label="Search participants" value={query} onChange={(event) => setQuery(event.target.value)} /></div></CardHeader><CardContent className="p-0">{loading ? <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground"><LoaderCircle className="animate-spin" /> Loading records…</div> : filtered.length === 0 ? <div className="p-10 text-center"><Users className="mx-auto mb-3 size-8 text-muted-foreground" /><p className="font-semibold">No participants found</p><p className="text-sm text-muted-foreground">Register a participant or change your search.</p></div> : <div className="divide-y divide-border/70">{filtered.map((participant) => <button key={participant.id} className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 text-left transition hover:bg-muted/40 sm:grid-cols-[1fr_90px_110px_auto] sm:px-6" onClick={() => setSelected(participant)}><div><p className="font-semibold">{participant.fullName}</p><p className="text-xs text-muted-foreground">{participant.registrationId}</p></div><p className="hidden text-sm text-muted-foreground sm:block">{participant.checkedInAt ? new Date(participant.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p><Badge variant={participant.checkedInAt ? 'default' : 'secondary'} className={participant.checkedInAt ? 'bg-emerald-100 text-emerald-800' : ''}>{participant.checkedInAt ? 'Checked in' : 'Registered'}</Badge><ArrowRight className="size-4 text-muted-foreground" /></button>)}</div>}</CardContent></Card>
          <Card className="border-0 bg-[#171b21] text-white shadow-[0_16px_40px_rgba(23,27,33,0.18)] ring-0"><CardHeader><div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-[#d5a72f] text-[#171b21]"><QrCode /></div><CardTitle className="text-xl font-bold">Fast check-in</CardTitle><CardDescription className="text-white/60">Use the device camera to scan a participant’s unique registration pass.</CardDescription></CardHeader><CardContent><Button className="h-11 w-full bg-white text-[#171b21] hover:bg-white/90" onClick={() => setScannerOpen(true)}><QrCode /> Open scanner</Button><p className="mt-4 text-xs leading-relaxed text-white/45">Emergency details remain hidden until a participant record is opened by an authorised volunteer.</p></CardContent></Card>
        </section>
      </div>
      <RegistrationDialog open={registrationOpen} setOpen={setRegistrationOpen} saving={saving} submit={submitRegistration} />
      <ScannerDialog open={scannerOpen} setOpen={setScannerOpen} videoRef={videoRef} scanCode={scanCode} setScanCode={setScanCode} scanMessage={scanMessage} startScanner={startScanner} checkIn={checkIn} stopScanner={stopScanner} />
      <ParticipantDialog participant={selected} setParticipant={setSelected} qrImage={qrImage} checkIn={checkIn} />
    </main>
  );
}

function RegistrationDialog({ open, setOpen, saving, submit }: { open: boolean; setOpen: (open: boolean) => void; saving: boolean; submit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><form onSubmit={submit}><DialogHeader><DialogTitle className="text-xl font-bold">New participant registration</DialogTitle><DialogDescription>Collect only what Sikh Tactical needs for attendance and emergency support.</DialogDescription></DialogHeader><FieldGroup className="mt-6">
    <FieldSet><FieldLegend>Participant details</FieldLegend><div className="grid gap-4 sm:grid-cols-2"><FormField name="fullName" label="Full name" required /><FormField name="mobile" label="Mobile number" type="tel" required /><FormField name="email" label="Email address" type="email" /><FormField name="dateOfBirth" label="Date of birth" type="date" /></div></FieldSet>
    <FieldSet><FieldLegend>Home address</FieldLegend><div className="grid gap-4 sm:grid-cols-2"><FormField name="addressLine1" label="Address line 1" required /><FormField name="addressLine2" label="Address line 2" /><FormField name="city" label="Town or city" required /><FormField name="postcode" label="Postcode" required /></div></FieldSet>
    <FieldSet><FieldLegend>Emergency contact</FieldLegend><div className="grid gap-4 sm:grid-cols-2"><FormField name="emergencyName" label="Contact name" required /><FormField name="emergencyPhone" label="Contact number" type="tel" required /><Field><FieldLabel htmlFor="emergencyRelationship">Relationship</FieldLabel><NativeSelect className="w-full" name="emergencyRelationship" id="emergencyRelationship" required defaultValue=""><NativeSelectOption value="" disabled>Select relationship</NativeSelectOption><NativeSelectOption value="Parent">Parent</NativeSelectOption><NativeSelectOption value="Spouse or partner">Spouse or partner</NativeSelectOption><NativeSelectOption value="Sibling">Sibling</NativeSelectOption><NativeSelectOption value="Friend">Friend</NativeSelectOption><NativeSelectOption value="Other">Other</NativeSelectOption></NativeSelect></Field><Field><FieldLabel htmlFor="medicalNotes">Medical or accessibility notes</FieldLabel><Textarea id="medicalNotes" name="medicalNotes" placeholder="Optional—only details needed in an emergency" /></Field></div></FieldSet>
    <label className="flex gap-3 rounded-xl border bg-muted/40 p-4 text-sm"><input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-[#171b21]" /><span><strong className="block">Participant consent</strong><span className="text-muted-foreground">The participant agrees that Sikh Tactical may store and use these details for event administration, attendance and emergency support.</span></span></label>
  </FieldGroup><DialogFooter className="mt-6"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving} className="bg-[#d5a72f] text-[#171b21] hover:bg-[#e3b84a]">{saving ? <LoaderCircle className="animate-spin" /> : <UserPlus />}{saving ? 'Saving…' : 'Register participant'}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function ScannerDialog({ open, setOpen, videoRef, scanCode, setScanCode, scanMessage, startScanner, checkIn, stopScanner }: { open: boolean; setOpen: (open: boolean) => void; videoRef: RefObject<HTMLVideoElement | null>; scanCode: string; setScanCode: (value: string) => void; scanMessage: string; startScanner: () => void; checkIn: (code: string) => Promise<void>; stopScanner: () => void }) {
  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) stopScanner(); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle className="text-xl font-bold">Scan registration pass</DialogTitle><DialogDescription>Point the camera at the participant’s Sikh Tactical QR code.</DialogDescription></DialogHeader><div className="overflow-hidden rounded-xl bg-[#171b21]"><video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline /><div className="border-t border-white/10 p-3"><Button className="w-full bg-white text-[#171b21] hover:bg-white/90" onClick={startScanner}><QrCode /> Start camera</Button></div></div><form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void checkIn(scanCode); }}><Input value={scanCode} onChange={(event) => setScanCode(event.target.value)} placeholder="Registration ID, e.g. ST-12AB34CD" aria-label="Registration ID" /><Button type="submit">Check in</Button></form>{scanMessage && <p role="status" className="rounded-lg bg-muted p-3 text-sm">{scanMessage}</p>}</DialogContent></Dialog>;
}

function ParticipantDialog({ participant, setParticipant, qrImage, checkIn }: { participant: Participant | null; setParticipant: (participant: Participant | null) => void; qrImage: string; checkIn: (code: string) => Promise<void> }) {
  return <Dialog open={Boolean(participant)} onOpenChange={(open) => !open && setParticipant(null)}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">{participant && <><DialogHeader><div className="mb-2 flex items-center justify-between gap-3"><Badge variant={participant.checkedInAt ? 'default' : 'secondary'} className={participant.checkedInAt ? 'bg-emerald-100 text-emerald-800' : ''}>{participant.checkedInAt ? 'Checked in' : 'Registered'}</Badge><span className="font-mono text-xs text-muted-foreground">{participant.registrationId}</span></div><DialogTitle className="text-2xl font-black">{participant.fullName}</DialogTitle><DialogDescription>Private participant record—share only with authorised volunteers.</DialogDescription></DialogHeader><div className="grid gap-5 py-3"><div className="grid grid-cols-[auto_1fr] gap-3 rounded-xl bg-muted/50 p-4"><Phone className="mt-0.5 size-4" /><div><p className="font-medium">{participant.mobile}</p>{participant.email && <p className="text-sm text-muted-foreground">{participant.email}</p>}</div><MapPin className="mt-0.5 size-4" /><p className="text-sm">{participant.addressLine1}{participant.addressLine2 ? `, ${participant.addressLine2}` : ''}, {participant.city}, {participant.postcode}</p></div><div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-amber-800">Emergency contact</p><p className="mt-2 font-semibold">{participant.emergencyName} · {participant.emergencyRelationship}</p><p className="text-sm">{participant.emergencyPhone}</p>{participant.medicalNotes && <p className="mt-3 border-t border-amber-200 pt-3 text-sm"><strong>Important notes:</strong> {participant.medicalNotes}</p>}</div>{qrImage && <div className="mx-auto text-center"><img src={qrImage} alt={`QR registration pass for ${participant.fullName}`} className="mx-auto size-52" /><p className="mt-2 text-xs text-muted-foreground">Scan this pass on arrival</p></div>}</div>{!participant.checkedInAt && <DialogFooter><Button className="w-full bg-[#d5a72f] text-[#171b21] hover:bg-[#e3b84a]" onClick={() => void checkIn(participant.registrationId)}><CheckCircle2 /> Check in now</Button></DialogFooter>}</>}</DialogContent></Dialog>;
}

function FormField({ name, label, type = 'text', required = false }: { name: string; label: string; type?: string; required?: boolean }) { return <Field><FieldLabel htmlFor={name}>{label}{required && ' *'}</FieldLabel><Input id={name} name={name} type={type} required={required} /><FieldDescription>{required ? 'Required' : 'Optional'}</FieldDescription></Field>; }
function StatCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) { return <Card className="border-0 shadow-sm ring-black/6"><CardContent className="flex items-center gap-4"><div className="flex size-11 items-center justify-center rounded-xl bg-[#171b21] text-[#d5a72f]">{icon}</div><div><p className="text-sm font-medium text-muted-foreground">{label}</p><div className="flex items-baseline gap-2"><strong className="text-2xl font-black">{value}</strong><span className="text-xs text-muted-foreground">{note}</span></div></div></CardContent></Card>; }
