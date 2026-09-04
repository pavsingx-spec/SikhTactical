import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toParticipant } from '@/lib/participants';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const { data: volunteer } = await supabase.from('volunteers').select('email').eq('email', user.email.toLowerCase()).eq('active', true).maybeSingle();
  if (!volunteer) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const body = await request.json() as { registrationId?: string };
  const registrationId = body.registrationId?.trim().toUpperCase();
  if (!registrationId) return NextResponse.json({ error: 'Enter or scan a registration ID.' }, { status: 400 });
  const { data, error } = await supabase.from('participants').update({ checked_in_at: new Date().toISOString() }).eq('registration_id', registrationId).select().maybeSingle();
  if (error) return NextResponse.json({ error: 'Check-in could not be completed.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'No participant matched this registration ID.' }, { status: 404 });
  return NextResponse.json({ participant: toParticipant(data) });
}
