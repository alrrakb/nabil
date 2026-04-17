-- =====================================================
-- نظام إدارة المراسلات الداخلية - معهد دلتا العالي
-- Internal Correspondence Management System Schema
-- =====================================================
-- Run this in your Supabase SQL Editor to set up tables and RLS

-- ==================== TABLES ====================

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'supervisor', 'employee')),
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Correspondences Table
CREATE TABLE IF NOT EXISTS correspondences (
  id SERIAL PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'internal' CHECK (type IN ('incoming', 'outgoing', 'internal')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  from_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  to_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  assigned_to_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_by_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Correspondence History Table
CREATE TABLE IF NOT EXISTS correspondence_history (
  id SERIAL PRIMARY KEY,
  correspondence_id INTEGER NOT NULL REFERENCES correspondences(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  notes TEXT,
  performed_by_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Archive Table
CREATE TABLE IF NOT EXISTS archive (
  id SERIAL PRIMARY KEY,
  correspondence_id INTEGER NOT NULL REFERENCES correspondences(id) ON DELETE CASCADE,
  archive_number TEXT NOT NULL UNIQUE,
  archive_location TEXT,
  notes TEXT,
  archived_by_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_correspondences_status ON correspondences(status);
CREATE INDEX IF NOT EXISTS idx_correspondences_type ON correspondences(type);
CREATE INDEX IF NOT EXISTS idx_correspondences_priority ON correspondences(priority);
CREATE INDEX IF NOT EXISTS idx_correspondences_to_dept ON correspondences(to_department_id);
CREATE INDEX IF NOT EXISTS idx_correspondence_history_corr_id ON correspondence_history(correspondence_id);
CREATE INDEX IF NOT EXISTS idx_archive_corr_id ON archive(correspondence_id);

-- ==================== UPDATED_AT TRIGGER ====================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_correspondences_updated_at
  BEFORE UPDATE ON correspondences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE correspondences ENABLE ROW LEVEL SECURITY;
ALTER TABLE correspondence_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive ENABLE ROW LEVEL SECURITY;

-- Admin Policy: Full access
CREATE POLICY "admins_full_access_departments" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.email = auth.jwt()->>'email'
        AND employees.role = 'admin'
    )
  );

CREATE POLICY "admins_full_access_employees" ON employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.email = auth.jwt()->>'email'
        AND e.role = 'admin'
    )
  );

CREATE POLICY "admins_full_access_correspondences" ON correspondences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.email = auth.jwt()->>'email'
        AND employees.role = 'admin'
    )
  );

CREATE POLICY "admins_full_access_history" ON correspondence_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.email = auth.jwt()->>'email'
        AND employees.role = 'admin'
    )
  );

CREATE POLICY "admins_full_access_archive" ON archive
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.email = auth.jwt()->>'email'
        AND employees.role = 'admin'
    )
  );

-- Supervisor Policy: Read all, write to their department
CREATE POLICY "supervisors_read_departments" ON departments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.email = auth.jwt()->>'email'
        AND employees.role IN ('supervisor', 'employee')
    )
  );

CREATE POLICY "supervisors_read_employees" ON employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "supervisors_access_correspondences" ON correspondences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.email = auth.jwt()->>'email'
        AND (
          e.role = 'supervisor'
          OR e.id = correspondences.assigned_to_id
          OR e.id = correspondences.created_by_id
          OR e.department_id = correspondences.to_department_id
        )
    )
  );

CREATE POLICY "employees_read_history" ON correspondence_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "employees_insert_history" ON correspondence_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "employees_read_archive" ON archive
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.email = auth.jwt()->>'email'
    )
  );

-- ==================== SAMPLE DATA ====================
-- Uncomment and run if you want initial seed data:

/*
INSERT INTO departments (name, description) VALUES
  ('قسم شؤون الطلاب', 'إدارة شؤون الطلاب والتسجيل'),
  ('قسم الشؤون الأكاديمية', 'الإشراف على المسار الأكاديمي'),
  ('قسم الموارد البشرية', 'إدارة شؤون الموظفين'),
  ('قسم المالية', 'الشؤون المالية والمحاسبة'),
  ('قسم تقنية المعلومات', 'دعم وصيانة الأنظمة');

INSERT INTO employees (name, email, role, department_id) VALUES
  ('أحمد محمد العمري', 'ahmed@delta.edu.eg', 'admin', 1),
  ('فاطمة علي حسن', 'fatima@delta.edu.eg', 'supervisor', 2),
  ('محمد إبراهيم سالم', 'mohammed@delta.edu.eg', 'employee', 3),
  ('نورا عبدالله ناصر', 'noura@delta.edu.eg', 'supervisor', 4),
  ('خالد يوسف مصطفى', 'khaled@delta.edu.eg', 'employee', 5);
*/
