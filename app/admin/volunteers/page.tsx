import { redirect } from 'next/navigation';
import { VolunteerAccess } from '@/components/volunteer-access';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function VolunteerAccessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect('/login');
  if (!process.env.OWNER_EMAIL || user.email.toLowerCase() !== process.env.OWNER_EMAIL.toLowerCase()) redirect('/not-authorised');
  return <VolunteerAccess />;
}
