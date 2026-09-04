import Image from 'next/image';
import { ShieldAlert } from 'lucide-react';

export default function NotAuthorisedPage() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f4f1e8] px-5 py-12"><section className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 text-center shadow-xl"><Image src="/sikh-tactical-logo.png" alt="Sikh Tactical" width={80} height={80} className="mx-auto mb-5 size-20 rounded-xl object-cover" priority /><ShieldAlert className="mx-auto mb-3 size-7 text-[#b17e13]" /><h1 className="text-2xl font-black tracking-tight">Volunteer access required</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your email is signed in but has not been approved by the Sikh Tactical administrator.</p><div className="mt-6 flex flex-col gap-3"><a href="/login" className="rounded-lg bg-[#171b21] px-4 py-3 text-sm font-semibold text-white">Try another email</a><a href="/" className="text-sm font-semibold text-[#8b6513] hover:underline">Return to registration</a></div></section></main>;
}
