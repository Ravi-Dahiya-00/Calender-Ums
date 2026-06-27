-- ================================================
-- UMS Calendar Integration — Supabase SQL Schema
-- Run this in your Supabase SQL Editor
-- ================================================

-- Events table (stores all academic calendar events)
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL,           -- MTE, ETE, CA, HOLIDAY, WORKSHOP, or any custom type
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  color       TEXT DEFAULT '#6366F1',  -- Hex color for this event on the calendar
  venue       TEXT,
  subject     TEXT,
  branch      TEXT DEFAULT 'ALL',      -- CSE, ECE, ME, ALL, etc.
  semester    INTEGER,                 -- 1-8, or NULL for all semesters
  metadata    JSONB DEFAULT '{}',      -- Flexible field for any extra data
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries by time range and type
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_branch ON events(branch);

-- Event sources table (tracks which API endpoints are registered)
-- This mirrors api-config.json but stored in DB for dynamic updates
CREATE TABLE IF NOT EXISTS event_sources (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT UNIQUE NOT NULL,    -- e.g. "mte", "ete", "ca"
  label     TEXT NOT NULL,           -- Display name: "Mid Term Exams"
  endpoint  TEXT NOT NULL,           -- API endpoint URL
  color     TEXT DEFAULT '#6366F1',
  enabled   BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- Seed Data (Realistic dummy events for demo)
-- ================================================
INSERT INTO events (title, description, type, start_time, end_time, color, venue, subject, branch, semester, metadata) VALUES
  ('Data Structures — MTE', 'Syllabus: Arrays, Linked Lists, Stacks, Queues, Trees (Units 1-3). Closed-book examination.', 'MTE', '2026-09-15 10:00:00+05:30', '2026-09-15 12:00:00+05:30', '#EF4444', 'Block 33, Hall A', 'Data Structures', 'CSE', 5, '{"subject_code": "CS301", "max_marks": 30, "faculty": "Dr. Sharma"}'),
  ('Operating Systems — MTE', 'Syllabus: Process Management, CPU Scheduling, Memory Management (Units 1-3).', 'MTE', '2026-09-17 10:00:00+05:30', '2026-09-17 12:00:00+05:30', '#EF4444', 'Block 33, Hall B', 'Operating Systems', 'CSE', 5, '{"subject_code": "CS302", "max_marks": 30, "faculty": "Dr. Gupta"}'),
  ('Computer Networks — MTE', 'Syllabus: OSI Model, TCP/IP, Data Link Layer (Units 1-3).', 'MTE', '2026-09-19 10:00:00+05:30', '2026-09-19 12:00:00+05:30', '#EF4444', 'Block 34, Hall C', 'Computer Networks', 'CSE', 5, '{"subject_code": "CS303", "max_marks": 30, "faculty": "Prof. Mehta"}'),

  ('DBMS — ETE', 'Complete syllabus. ER Diagrams, SQL, Normalization, Transactions.', 'ETE', '2026-11-20 09:00:00+05:30', '2026-11-20 12:00:00+05:30', '#8B5CF6', 'Examination Hall 1', 'Database Management Systems', 'CSE', 5, '{"subject_code": "CS304", "max_marks": 70, "faculty": "Dr. Verma"}'),
  ('Software Engineering — ETE', 'Complete syllabus. SDLC, Agile, UML Diagrams, Testing.', 'ETE', '2026-11-23 09:00:00+05:30', '2026-11-23 12:00:00+05:30', '#8B5CF6', 'Examination Hall 2', 'Software Engineering', 'CSE', 5, '{"subject_code": "CS305", "max_marks": 70, "faculty": "Prof. Singh"}'),

  ('Data Structures — CA Test 1', 'CA Test: Arrays and Linked Lists. 20 marks. Bring calculator.', 'CA', '2026-08-20 11:00:00+05:30', '2026-08-20 12:00:00+05:30', '#F59E0B', 'Block 33, Room 301', 'Data Structures', 'CSE', 5, '{"subject_code": "CS301", "max_marks": 20, "ca_number": 1}'),
  ('Operating Systems — CA Test 1', 'CA Test: Process Management and Scheduling. 20 marks.', 'CA', '2026-08-22 11:00:00+05:30', '2026-08-22 12:00:00+05:30', '#F59E0B', 'Block 33, Room 302', 'Operating Systems', 'CSE', 5, '{"subject_code": "CS302", "max_marks": 20, "ca_number": 1}'),
  ('Data Structures — CA Test 2', 'CA Test: Trees, Graphs, Hashing. 20 marks.', 'CA', '2026-09-10 11:00:00+05:30', '2026-09-10 12:00:00+05:30', '#F59E0B', 'Block 33, Room 301', 'Data Structures', 'CSE', 5, '{"subject_code": "CS301", "max_marks": 20, "ca_number": 2}'),

  ('Diwali Holiday', 'University closed for Diwali celebrations.', 'HOLIDAY', '2026-10-20 00:00:00+05:30', '2026-10-22 23:59:59+05:30', '#10B981', NULL, NULL, 'ALL', NULL, '{"official": true}'),
  ('Independence Day', 'National Holiday. University closed.', 'HOLIDAY', '2026-08-15 00:00:00+05:30', '2026-08-15 23:59:59+05:30', '#10B981', NULL, NULL, 'ALL', NULL, '{"official": true}'),

  ('Tech Workshop: Cloud Computing', 'Free workshop on AWS, Azure, GCP basics. Open to all students. Registration required.', 'WORKSHOP', '2026-09-05 09:00:00+05:30', '2026-09-05 17:00:00+05:30', '#06B6D4', 'Seminar Hall, Block A', NULL, 'ALL', NULL, '{"registration_link": "https://forms.google.com", "seats": 100, "organizer": "CSE Department"}'),
  ('Hackathon 2026 — Registration Opens', 'Annual university hackathon. 24-hour coding challenge. Cash prizes worth ₹50,000.', 'EVENT', '2026-10-01 09:00:00+05:30', '2026-10-01 17:00:00+05:30', '#EC4899', 'Innovation Lab', NULL, 'ALL', NULL, '{"prize_pool": "₹50,000", "team_size": "2-4", "registration_deadline": "2026-09-28"}'),
  ('Fee Submission Deadline', 'Last date for semester fee submission. Late fine applicable after this date.', 'DEADLINE', '2026-08-31 17:00:00+05:30', '2026-08-31 17:00:00+05:30', '#DC2626', 'Accounts Office', NULL, 'ALL', NULL, '{"late_fine_per_day": 100, "portal": "https://ums.university.edu/fees"}');

-- Default event sources seed
INSERT INTO event_sources (source_id, label, endpoint, color, enabled) VALUES
  ('mte', 'Mid Term Exams', '/api/events?type=MTE', '#EF4444', true),
  ('ete', 'End Term Exams', '/api/events?type=ETE', '#8B5CF6', true),
  ('ca', 'Continuous Assessment', '/api/events?type=CA', '#F59E0B', true),
  ('holiday', 'Holidays', '/api/events?type=HOLIDAY', '#10B981', true),
  ('workshop', 'Workshops', '/api/events?type=WORKSHOP', '#06B6D4', true),
  ('event', 'Events', '/api/events?type=EVENT', '#EC4899', true),
  ('deadline', 'Deadlines', '/api/events?type=DEADLINE', '#DC2626', true);
