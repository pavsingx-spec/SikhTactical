import { NextResponse } from 'next/server';
import { createActivationCode, hashActivationCode } from '@/lib/activation-code';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function isOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return Boolean(user?.email && process.env.OWNER_EMAIL && user.email.toLowerCase() === process.env.OWNER_EMAIL.toLowerCase());
}

export async function GET() {
  if (!(await isOwner())) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const { data, error } = await createAdminClient().from('volunteers').select('id,email,role,active,created_at,password_activated_at,invite_expires_at').order('role').order('email');
  if (error) return NextResponse.json({ error: 'Unable to load volunteer access.' }, { status: 500 });
  return NextResponse.json({ volunteers: data || [] });
}

export async function POST(request: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const body = await request.json() as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || email.length > 254 || !email.includes('@')) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (email === process.env.OWNER_EMAIL?.toLowerCase()) return NextResponse.json({ error: 'The owner account is already protected.' }, { status: 400 });

  const activationCode = createActivationCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await createAdminClient().from('volunteers').upsert({
    email,
    role: 'volunteer',
    active: true,
    invite_code_hash: hashActivationCode(activationCode),
    invite_expires_at: expiresAt,
  }, { onConflict: 'email' }).select('id,email,role,active,created_at,password_activated_at,invite_expires_at').single();
  if (error || !data) return NextResponse.json({ error: 'Volunteer access could not be added.' }, { status: 500 });
  return NextResponse.json({ volunteer: data, activationCode, expiresAt }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await isOwner())) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const body = await request.json() as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || email === process.env.OWNER_EMAIL?.toLowerCase()) return NextResponse.json({ error: 'Owner access cannot be removed.' }, { status: 400 });
  const { error } = await createAdminClient().from('volunteers').update({ active: false }).eq('email', email).eq('role', 'volunteer');
  if (error) return NextResponse.json({ error: 'Volunteer access could not be removed.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
