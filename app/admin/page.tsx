import { redirect } from 'next/navigation';
import { RegistrationDashboard } from '@/components/registration-dashboard';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect('/login');
  const { data: volunteer } = await supabase.from('volunteers').select('email, role, active').eq('email', user.email.toLowerCase()).eq('active', true).maybeSingle();
  if (!volunteer) redirect('/not-authorised');
  return <RegistrationDashboard volunteerName={user.email} />;
}
