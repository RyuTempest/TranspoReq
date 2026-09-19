CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'USER')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS positions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position_id BIGINT REFERENCES positions(id),
  department_id BIGINT REFERENCES departments(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transportation_modes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fare_rates (
  id BIGSERIAL PRIMARY KEY,
  from_location_id BIGINT NOT NULL REFERENCES locations(id),
  to_location_id BIGINT NOT NULL REFERENCES locations(id),
  transportation_mode_id BIGINT NOT NULL REFERENCES transportation_modes(id),
  fare NUMERIC(12, 2) NOT NULL CHECK (fare >= 0),
  effective_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_location_id, to_location_id, transportation_mode_id, effective_date)
);

CREATE TABLE IF NOT EXISTS tft_forms (
  id BIGSERIAL PRIMARY KEY,
  tft_no TEXT NOT NULL UNIQUE,
  employee_id BIGINT NOT NULL REFERENCES employees(id),
  date_filed DATE NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'CHECKED', 'APPROVED', 'REJECTED', 'CANCELLED')),
  grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  created_by BIGINT NOT NULL REFERENCES users(id),
  updated_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE SEQUENCE IF NOT EXISTS tft_number_seq START WITH 1;

CREATE TABLE IF NOT EXISTS tft_transport_rows (
  id BIGSERIAL PRIMARY KEY,
  tft_id BIGINT NOT NULL REFERENCES tft_forms(id) ON DELETE CASCADE,
  travel_date DATE NOT NULL,
  from_location_id BIGINT NOT NULL REFERENCES locations(id),
  to_location_id BIGINT NOT NULL REFERENCES locations(id),
  transportation_mode_id BIGINT NOT NULL REFERENCES transportation_modes(id),
  number_of_trips INTEGER NOT NULL CHECK (number_of_trips > 0),
  unit_fare NUMERIC(12, 2) NOT NULL CHECK (unit_fare >= 0),
  total_amount NUMERIC(12, 2) GENERATED ALWAYS AS (number_of_trips * unit_fare) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tft_forms_date_idx ON tft_forms(date_filed);
CREATE INDEX IF NOT EXISTS tft_forms_status_idx ON tft_forms(status);
CREATE INDEX IF NOT EXISTS tft_rows_tft_idx ON tft_transport_rows(tft_id);

INSERT INTO users (username, name, password_hash, role)
VALUES
  ('admin', 'Admin', crypt('admin123', gen_salt('bf')), 'ADMIN'),
  ('user', 'Staff User', crypt('user123', gen_salt('bf')), 'USER')
ON CONFLICT (username) DO NOTHING;

INSERT INTO departments (name) VALUES ('Operations'), ('Finance'), ('Administration'), ('Human Resources') ON CONFLICT DO NOTHING;
INSERT INTO positions (name) VALUES ('Operations Officer'), ('Finance Associate'), ('Department Head') ON CONFLICT DO NOTHING;
INSERT INTO locations (name) VALUES ('Head Office'), ('Cebu IT Park'), ('SM City Cebu'), ('Mactan Airport'), ('Ayala Center'), ('La Salle') ON CONFLICT DO NOTHING;
INSERT INTO transportation_modes (name) VALUES ('Jeepney'), ('Tricycle'), ('Taxi'), ('Bus'), ('Motorcycle'), ('Private Vehicle'), ('Other') ON CONFLICT DO NOTHING;