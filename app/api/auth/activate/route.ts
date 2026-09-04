import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

import { hashActivationCode } from '@/lib/activation-code';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const INVALID_DETAILS = 'Those setup details are invalid or the code has expired.';

function hashesMatch(provided: string, stored: string) {
  const providedBuffer = Buffer.from(provided, 'hex');
  const storedBuffer = Buffer.from(stored, 'hex');
  return providedBuffer.length === storedBuffer.length && timingSafeEqual(providedBuffer, storedBuffer);
}

export async function POST(request: Request) {
  let body: { email?: string; activationCode?: string; password?: string };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Enter your email, setup code and password.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() || '';
  const activationCode = body.activationCode?.trim() || '';
  const password = body.password || '';

  if (!email || email.length > 254 || !email.includes('@') || !activationCode) {
    return NextResponse.json({ error: INVALID_DETAILS }, { status: 400 });
  }
  if (password.length < 12 || password.length > 72) {
    return NextResponse.json({ error: 'Choose a password between 12 and 72 characters.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: volunteer, error: volunteerError } = await admin
    .from('volunteers')
    .select('id,email,active,invite_code_hash,invite_expires_at')
    .eq('email', email)
    .eq('active', true)
    .maybeSingle();

  const expired = !volunteer?.invite_expires_at || new Date(volunteer.invite_expires_at).getTime() <= Date.now();
  const providedHash = hashActivationCode(activationCode);
  if (volunteerError || !volunteer?.invite_code_hash || expired || !hashesMatch(providedHash, volunteer.invite_code_hash)) {
    return NextResponse.json({ error: INVALID_DETAILS }, { status: 403 });
  }

  const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) return NextResponse.json({ error: 'Password setup is temporarily unavailable.' }, { status: 500 });

  const existingUser = usersPage.users.find((user) => user.email?.toLowerCase() === email);
  const authResult = existingUser
    ? await admin.auth.admin.updateUserById(existingUser.id, { password, email_confirm: true })
    : await admin.auth.admin.createUser({ email, password, email_confirm: true });

  if (authResult.error) {
    return NextResponse.json({ error: 'Password setup is temporarily unavailable.' }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from('volunteers')
    .update({
      invite_code_hash: null,
      invite_expires_at: null,
      password_activated_at: new Date().toISOString(),
    })
    .eq('id', volunteer.id)
    .eq('invite_code_hash', volunteer.invite_code_hash);

  if (updateError) return NextResponse.json({ error: 'Password was set, but the setup code could not be closed.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
