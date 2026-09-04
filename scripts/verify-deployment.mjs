import { readFile } from "node:fs/promises";
import postgres from "postgres";

const siteUrl = "https://sikh-tactical-registration.vercel.app";
const testName = "Sikh Tactical Deployment Test";
const registrationResponse = await fetch(`${siteUrl}/api/participants`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    fullName: testName,
    mobile: "07000000000",
    addressLine1: "1 Test Way",
    city: "Birmingham",
    postcode: "B1 1AA",
    emergencyName: "Test Contact",
    emergencyPhone: "07000000001",
    emergencyRelationship: "Other",
    consent: true,
  }),
});
const registrationBody = await registrationResponse.json();

if (registrationResponse.status !== 201 || !registrationBody.participant?.registrationId) {
  throw new Error(`Live registration failed with status ${registrationResponse.status}.`);
}

const unauthorisedResponse = await fetch(`${siteUrl}/api/participants`);
if (unauthorisedResponse.status !== 401) {
  throw new Error(`Protected participant list returned ${unauthorisedResponse.status} instead of 401.`);
}

const envText = await readFile(".env.production.local", "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      const key = line.slice(0, index);
      let value = line.slice(index + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) value = JSON.parse(value);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      return [key, value];
    }),
);
const connectionString = env.POSTGRES_URL_NON_POOLING ?? env.POSTGRES_URL;
if (!connectionString) throw new Error("No production Postgres connection string was found.");

const sql = postgres(connectionString, { max: 1, ssl: "require" });
try {
  await sql`delete from public.participants where registration_id = ${registrationBody.participant.registrationId} and full_name = ${testName}`;
} finally {
  await sql.end();
}

console.log("Live public registration passed and the test record was removed.");
console.log("Protected participant data correctly returned 401 without a volunteer login.");
