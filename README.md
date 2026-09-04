# Sikh Tactical Registration

Public event registration and QR check-in for Sikh Tactical, with a protected volunteer dashboard and owner-managed volunteer access.

Live site: [sikh-tactical-registration.vercel.app](https://sikh-tactical-registration.vercel.app/)

## Features

- Public participant registration and QR arrival passes
- Camera-based QR check-in and manual check-in fallback
- Protected participant and emergency-contact information
- Password login with owner-issued, single-use setup codes
- Owner controls for adding and removing volunteer access
- Supabase database and authentication
- Vercel deployment

## Local setup

1. Install Node.js 22 or later and pnpm.
2. Copy `.env.example` to `.env.local` and add the Supabase values.
3. Run `pnpm install`.
4. Run `pnpm dev`.

Apply the SQL files in `supabase/migrations` to the Supabase project in filename order.

## Environment variables

See `.env.example`. Never commit real keys or local environment files.

## Privacy

This application stores personal and emergency-contact information. Production access must remain limited to authorised Sikh Tactical volunteers, and access should be removed as soon as it is no longer required.
