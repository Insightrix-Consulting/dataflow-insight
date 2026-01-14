-- Create enums for document types, statuses, reading types, and roles
CREATE TYPE public.document_type AS ENUM ('energy', 'transport', 'unknown');
CREATE TYPE public.document_status AS ENUM ('uploaded', 'processing', 'needs_review', 'approved', 'failed');
CREATE TYPE public.reading_type AS ENUM ('Actual', 'Estimated', 'Customer Read', 'Unknown');
CREATE TYPE public.transport_mode AS ENUM ('Road', 'Air', 'Sea', 'Unknown');
CREATE TYPE public.uk_zone AS ENUM ('Mainland', 'Island', 'Ireland', 'Unknown');
CREATE TYPE public.app_role AS ENUM ('admin', 'reviewer', 'viewer');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  UNIQUE (user_id, role)
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_url TEXT,
  document_type document_type NOT NULL DEFAULT 'unknown',
  supplier_name TEXT,
  status document_status NOT NULL DEFAULT 'uploaded',
  overall_confidence INTEGER CHECK (overall_confidence >= 0 AND overall_confidence <= 100),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create energy_invoices table (Pilot 1)
CREATE TABLE public.energy_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  invoice_date DATE,
  billing_period_start DATE,
  billing_period_end DATE,
  reading_type reading_type DEFAULT 'Unknown',
  kwh_used DECIMAL(12, 2),
  confidence_invoice_date INTEGER CHECK (confidence_invoice_date >= 0 AND confidence_invoice_date <= 100),
  confidence_reading_type INTEGER CHECK (confidence_reading_type >= 0 AND confidence_reading_type <= 100),
  confidence_kwh INTEGER CHECK (confidence_kwh >= 0 AND confidence_kwh <= 100),
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transport_records table (Pilot 2 - Preview)
CREATE TABLE public.transport_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_created_date DATE,
  supplier_code TEXT,
  supplier_name TEXT,
  ship_country TEXT,
  ship_area TEXT,
  destination_postcode TEXT,
  total_weight DECIMAL(10, 2),
  transport_mode transport_mode DEFAULT 'Unknown',
  uk_zone uk_zone DEFAULT 'Unknown',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_log table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'reviewer' THEN 2
      WHEN 'viewer' THEN 3
    END
  LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles policies (only admins can manage)
CREATE POLICY "Users can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Documents policies
CREATE POLICY "All authenticated users can view documents" ON public.documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and reviewers can insert documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'reviewer')
  );

CREATE POLICY "Admins and reviewers can update documents" ON public.documents
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'reviewer')
  );

CREATE POLICY "Admins can delete documents" ON public.documents
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Energy invoices policies
CREATE POLICY "All authenticated users can view energy invoices" ON public.energy_invoices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and reviewers can insert energy invoices" ON public.energy_invoices
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'reviewer')
  );

CREATE POLICY "Admins and reviewers can update energy invoices" ON public.energy_invoices
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'reviewer')
  );

CREATE POLICY "Admins can delete energy invoices" ON public.energy_invoices
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Transport records policies (read-only for now)
CREATE POLICY "All authenticated users can view transport records" ON public.transport_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage transport records" ON public.transport_records
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Audit log policies
CREATE POLICY "All authenticated users can view audit log" ON public.audit_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert audit entries" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- First user becomes admin, others are viewers by default
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_energy_invoices_updated_at
  BEFORE UPDATE ON public.energy_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can view documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documents');

CREATE POLICY "Admins and reviewers can upload documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'documents' AND (
      public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'reviewer')
    )
  );

CREATE POLICY "Admins can delete documents" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin')
  );

-- Insert sample transport data for Pilot 2 preview
INSERT INTO public.transport_records (receipt_created_date, supplier_code, supplier_name, ship_country, ship_area, destination_postcode, total_weight, transport_mode, uk_zone) VALUES
('2024-01-05', 'DHL001', 'DHL Express', 'United Kingdom', 'London', 'SW1A 1AA', 25.50, 'Road', 'Mainland'),
('2024-01-08', 'FDX002', 'FedEx', 'Germany', 'Berlin', 'EC2A 4NE', 150.00, 'Air', 'Mainland'),
('2024-01-12', 'UPS003', 'UPS', 'France', 'Paris', 'M1 1AA', 75.25, 'Road', 'Mainland'),
('2024-01-15', 'MAE004', 'Maersk', 'China', 'Shanghai', 'LL55 4SU', 2500.00, 'Sea', 'Mainland'),
('2024-01-18', 'DHL001', 'DHL Express', 'United Kingdom', 'Edinburgh', 'EH1 1YZ', 45.00, 'Road', 'Mainland'),
('2024-01-20', 'FDX002', 'FedEx', 'United States', 'New York', 'BT1 1AA', 200.00, 'Air', 'Ireland'),
('2024-01-22', 'CMA005', 'CMA CGM', 'Japan', 'Tokyo', 'IV1 1AA', 1800.00, 'Sea', 'Mainland'),
('2024-01-25', 'UPS003', 'UPS', 'Spain', 'Madrid', 'IM1 1AA', 90.00, 'Air', 'Island');