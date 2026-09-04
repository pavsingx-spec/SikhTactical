export type Participant = {
  id: number; registrationId: string; fullName: string; mobile: string; email: string | null;
  dateOfBirth: string | null; addressLine1: string; addressLine2: string | null; city: string;
  postcode: string; emergencyName: string; emergencyPhone: string; emergencyRelationship: string;
  medicalNotes: string | null; createdAt: string; checkedInAt: string | null;
};

export function toParticipant(row: Record<string, unknown>): Participant {
  return {
    id: Number(row.id), registrationId: String(row.registration_id), fullName: String(row.full_name),
    mobile: String(row.mobile), email: row.email ? String(row.email) : null,
    dateOfBirth: row.date_of_birth ? String(row.date_of_birth) : null,
    addressLine1: String(row.address_line_1), addressLine2: row.address_line_2 ? String(row.address_line_2) : null,
    city: String(row.city), postcode: String(row.postcode), emergencyName: String(row.emergency_name),
    emergencyPhone: String(row.emergency_phone), emergencyRelationship: String(row.emergency_relationship),
    medicalNotes: row.medical_notes ? String(row.medical_notes) : null,
    createdAt: String(row.created_at), checkedInAt: row.checked_in_at ? String(row.checked_in_at) : null,
  };
}
