export type DocumentType = 'energy' | 'transport' | 'unknown';
export type DocumentStatus = 'uploaded' | 'processing' | 'needs_review' | 'approved' | 'failed';
export type ReadingType = 'Actual' | 'Estimated' | 'Customer Read' | 'Unknown';
export type TransportMode = 'Road' | 'Air' | 'Sea' | 'Unknown';
export type UKZone = 'Mainland' | 'Island' | 'Ireland' | 'Unknown';
export type AppRole = 'admin' | 'reviewer' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Document {
  id: string;
  filename: string;
  file_url: string | null;
  document_type: DocumentType;
  supplier_name: string | null;
  status: DocumentStatus;
  overall_confidence: number | null;
  uploaded_at: string;
  uploaded_by: string | null;
}

export interface EnergyInvoice {
  id: string;
  document_id: string;
  invoice_date: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  reading_type: ReadingType;
  kwh_used: number | null;
  confidence_invoice_date: number | null;
  confidence_reading_type: number | null;
  confidence_kwh: number | null;
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  document?: Document;
}

export interface TransportRecord {
  id: string;
  receipt_created_date: string | null;
  supplier_code: string | null;
  supplier_name: string | null;
  ship_country: string | null;
  ship_area: string | null;
  destination_postcode: string | null;
  total_weight: number | null;
  transport_mode: TransportMode;
  uk_zone: UKZone;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardStats {
  documentsUploaded: number;
  documentsProcessed: number;
  documentsNeedingReview: number;
  averageConfidence: number;
}
