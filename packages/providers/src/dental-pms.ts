export type SyncCursor = { value?: string; updatedAfter?: string };

export type ExternalPatient = {
  externalId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  locationExternalId?: string;
  updatedAt?: string;
};

export type ExternalTreatmentPlan = {
  externalId: string;
  patientExternalId: string;
  title: string;
  status: string;
  amount: number;
  procedureCodes: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type Page<T> = {
  records: T[];
  nextCursor?: SyncCursor;
};

export interface DentalPmsProvider {
  readonly name: string;
  testConnection(): Promise<{ ok: boolean; message?: string }>;
  listPatients(cursor?: SyncCursor): Promise<Page<ExternalPatient>>;
  listTreatmentPlans(cursor?: SyncCursor): Promise<Page<ExternalTreatmentPlan>>;
}
