alter table public.volunteers
  add column if not exists invite_code_hash text,
  add column if not exists invite_expires_at timestamptz,
  add column if not exists password_activated_at timestamptz;

comment on column public.volunteers.invite_code_hash is
  'SHA-256 hash of the current one-time password setup code.';

comment on column public.volunteers.invite_expires_at is
  'Expiry time for the current one-time password setup code.';

comment on column public.volunteers.password_activated_at is
  'Time the volunteer most recently completed password setup.';
