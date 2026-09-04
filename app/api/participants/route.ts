import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { toParticipant } from '@/lib/participants';

export const dynamic = 'force-dynamic';

async function authorisedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { supabase, user: null };
  const { data: volunteer } = await supabase.from('volunteers').select('email').eq('email', user.email.toLowerCase()).eq('active', true).maybeSingle();
  return { supabase, user: volunteer ? user : null };
}

export async function GET() {
  const { supabase, user } = await authorisedClient();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const { data, error } = await supabase.from('participants').select('*').order('id', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: 'Unable to load participant records.' }, { status: 500 });
  return NextResponse.json({ participants: (data || []).map(toParticipant) });
}

export async function POST(request: Request) {
  const { supabase, user } = await authorisedClient();
  const body = await request.json() as Record<string, unknown> & { website?: string };
  if (body.website) return NextResponse.json({ error: 'Registration could not be saved.' }, { status: 400 });
  const required = ['fullName', 'mobile', 'addressLine1', 'city', 'postcode', 'emergencyName', 'emergencyPhone', 'emergencyRelationship'];
  if (required.some((key) => typeof body[key] !== 'string' || !(body[key] as string).trim())) return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 });
  if (body.consent !== true) return NextResponse.json({ error: 'Participant consent is required.' }, { status: 400 });
  const limits: Record<string, number> = { fullName: 160, mobile: 50, email: 254, dateOfBirth: 20, addressLine1: 200, addressLine2: 200, city: 120, postcode: 20, emergencyName: 160, emergencyPhone: 50, emergencyRelationship: 80, medicalNotes: 1000 };
  if (Object.entries(limits).some(([key, limit]) => typeof body[key] === 'string' && (body[key] as string).length > limit)) return NextResponse.json({ error: 'One or more fields are too long.' }, { status: 400 });

  const registrationId = `ST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const row = {
    registration_id: registrationId,
    full_name: String(body.fullName).trim(), mobile: String(body.mobile).trim(),
    email: body.email ? String(body.email).trim() : null, date_of_birth: body.dateOfBirth || null,
    address_line_1: String(body.addressLine1).trim(), address_line_2: body.addressLine2 ? String(body.addressLine2).trim() : null,
    city: String(body.city).trim(), postcode: String(body.postcode).trim().toUpperCase(),
    emergency_name: String(body.emergencyName).trim(), emergency_phone: String(body.emergencyPhone).trim(),
    emergency_relationship: String(body.emergencyRelationship).trim(), medical_notes: body.medicalNotes ? String(body.medicalNotes).trim() : null,
    consent: true, registered_by: user?.id ?? null,
  };

  if (!user) {
    const { error } = await createAdminClient().from('participants').insert(row);
    if (error) return NextResponse.json({ error: 'Registration could not be saved.' }, { status: 500 });
    return NextResponse.json({ participant: { fullName: row.full_name, registrationId } }, { status: 201 });
  }

  const { data, error } = await supabase.from('participants').insert(row).select().single();
  if (error || !data) return NextResponse.json({ error: 'Registration could not be saved.' }, { status: 500 });
  return NextResponse.json({ participant: toParticipant(data) }, { status: 201 });
}
