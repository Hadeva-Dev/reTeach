-- ============================================
-- CLEANUP AND ENHANCEMENT: Database Schema Update
-- Migration: 005_cleanup_redundant_tables.sql
-- ============================================
-- Purpose:
-- 1. Remove unused and redundant tables identified through codebase analysis
-- 2. Add missing form_sessions table for student response tracking
-- 3. Enhance forms table with slug support
--
-- Summary of changes:
-- 1. DROP: textbook_library system (redundant with resources table)
-- 2. DROP: verification_quizzes system (unused - forms system handles all quizzing)
-- 3. CLEAN: study_plans redundant JSONB columns
-- 4. ADD: form_sessions table for tracking student submissions
-- 5. ADD: slug column to forms table
-- 6. ADD: session_id to responses table
-- ============================================

-- Safety: Begin transaction
BEGIN;

-- ============================================
-- SECTION 1: Drop Textbook Library Tables
-- ============================================
-- These tables duplicate functionality of resources/resource_pages
-- Current codebase primarily uses 'resources' table

DROP TABLE IF EXISTS public.topic_section_mappings CASCADE;
DROP TABLE IF EXISTS public.textbook_sections CASCADE;
DROP TABLE IF EXISTS public.course_textbooks CASCADE;
DROP TABLE IF EXISTS public.textbook_library CASCADE;

-- ============================================
-- SECTION 2: Drop Verification Quiz Tables
-- ============================================
-- These tables are defined in schema but not used in codebase
-- All quizzing functionality uses forms + form_sessions instead

DROP TABLE IF EXISTS public.quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.verification_quizzes CASCADE;

-- ============================================
-- SECTION 3: Clean Up Study Plans Table
-- ============================================
-- Remove redundant JSONB columns that duplicate other table data

-- Drop plan_data column (duplicates reading_assignments table)
ALTER TABLE public.study_plans
  DROP COLUMN IF EXISTS plan_data;

-- Drop weak_topics column (captured in survey_responses analysis)
ALTER TABLE public.study_plans
  DROP COLUMN IF EXISTS weak_topics;

-- Add cleaner column for storing just weak topic IDs
ALTER TABLE public.study_plans
  ADD COLUMN IF NOT EXISTS weak_topic_ids uuid[] DEFAULT '{}';

-- ============================================
-- SECTION 4: Clean Up Reading Assignments
-- ============================================
-- Remove foreign key reference to dropped textbook_sections table

ALTER TABLE public.reading_assignments
  DROP COLUMN IF EXISTS textbook_section_id;

-- ============================================
-- SECTION 5: Add Slug to Forms Table
-- ============================================
-- Add slug column for shareable URLs

ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS slug character varying(100) UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_forms_slug ON public.forms(slug);

-- Make form_url and sheet_url nullable (no longer using Google Forms)
ALTER TABLE public.forms
  ALTER COLUMN form_url DROP NOT NULL;

ALTER TABLE public.forms
  ALTER COLUMN sheet_url DROP NOT NULL;

COMMENT ON COLUMN public.forms.slug IS 'URL-safe unique identifier for shareable form links (e.g., "calculus-midterm-a3f2")';

-- ============================================
-- SECTION 6: Create Form Sessions Table
-- ============================================
-- Tracks individual student form submission sessions

CREATE TABLE IF NOT EXISTS public.form_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  form_id uuid NOT NULL,
  student_name character varying(255) NOT NULL,
  student_email character varying(255) NOT NULL,
  student_id uuid,

  -- Session tracking
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  time_spent_seconds integer,

  -- Analytics (optional)
  ip_address character varying(50),
  user_agent text,

  -- Scoring
  total_questions integer,
  correct_answers integer,
  score_percentage numeric(5,2),

  -- Denormalized for faster queries
  form_slug character varying(100),

  created_at timestamp with time zone DEFAULT now(),

  CONSTRAINT form_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT form_sessions_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.forms(id) ON DELETE CASCADE,
  CONSTRAINT form_sessions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL
);

-- Create indexes for form_sessions
CREATE INDEX IF NOT EXISTS idx_form_sessions_form_id ON public.form_sessions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_sessions_student_id ON public.form_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_form_sessions_student_email ON public.form_sessions(student_email);
CREATE INDEX IF NOT EXISTS idx_form_sessions_form_slug ON public.form_sessions(form_slug);
CREATE INDEX IF NOT EXISTS idx_form_sessions_completed_at ON public.form_sessions(completed_at DESC NULLS LAST);

COMMENT ON TABLE public.form_sessions IS 'Tracks individual student form submission sessions with name, email, and scoring data';
COMMENT ON COLUMN public.form_sessions.form_slug IS 'Denormalized slug from forms table for faster teacher dashboard queries';

-- ============================================
-- SECTION 7: Add Session ID to Responses
-- ============================================
-- Link responses to sessions

ALTER TABLE public.responses
  ADD COLUMN IF NOT EXISTS session_id uuid;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'responses_session_id_fkey'
  ) THEN
    ALTER TABLE public.responses
      ADD CONSTRAINT responses_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES public.form_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_responses_session_id ON public.responses(session_id);

COMMENT ON COLUMN public.responses.session_id IS 'Links individual response to student form session';

-- ============================================
-- SECTION 8: Add Helpful Indexes
-- ============================================
-- Add indexes to improve teacher dashboard query performance

-- Index for faster topic-based queries
CREATE INDEX IF NOT EXISTS idx_responses_topic_id
  ON public.responses(topic_id);

-- Index for faster correctness analysis
CREATE INDEX IF NOT EXISTS idx_responses_is_correct
  ON public.responses(is_correct);

-- Index for faster survey response queries by survey
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id
  ON public.survey_responses(survey_id);

-- Index for faster survey response queries by topic
CREATE INDEX IF NOT EXISTS idx_survey_responses_topic_id
  ON public.survey_responses(topic_id);

-- Index for faster student lookup
CREATE INDEX IF NOT EXISTS idx_survey_responses_student_email
  ON public.survey_responses(student_email);

-- ============================================
-- SECTION 9: Create Helpful Views
-- ============================================
-- Views to simplify common teacher dashboard queries

-- View: Form submission summary for teachers
CREATE OR REPLACE VIEW public.form_submission_summary AS
SELECT
  f.id as form_id,
  COALESCE(f.slug, f.form_id) as form_slug,
  f.title as form_title,
  f.course_id,
  COUNT(DISTINCT fs.id) as total_submissions,
  AVG(fs.score_percentage) as average_score,
  MIN(fs.score_percentage) as min_score,
  MAX(fs.score_percentage) as max_score,
  COUNT(DISTINCT fs.student_email) as unique_students,
  MIN(fs.completed_at) as first_submission,
  MAX(fs.completed_at) as latest_submission
FROM public.forms f
LEFT JOIN public.form_sessions fs ON f.id = fs.form_id
WHERE fs.completed_at IS NOT NULL
GROUP BY f.id, f.slug, f.form_id, f.title, f.course_id;

COMMENT ON VIEW public.form_submission_summary IS
  'Teacher dashboard view: Aggregate statistics for each form including submissions, scores, and timing';

-- View: Student performance by topic
CREATE OR REPLACE VIEW public.student_topic_performance AS
SELECT
  fs.student_email,
  fs.student_name,
  t.id as topic_id,
  t.name as topic_name,
  t.course_id,
  COUNT(r.id) as questions_answered,
  SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) as correct_answers,
  ROUND(
    (SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END)::numeric /
     NULLIF(COUNT(r.id), 0)::numeric * 100),
    2
  ) as topic_score_percentage,
  fs.form_id,
  fs.completed_at
FROM public.form_sessions fs
JOIN public.responses r ON fs.id = r.session_id
JOIN public.topics t ON r.topic_id = t.id
WHERE fs.completed_at IS NOT NULL
GROUP BY
  fs.student_email,
  fs.student_name,
  t.id,
  t.name,
  t.course_id,
  fs.form_id,
  fs.completed_at;

COMMENT ON VIEW public.student_topic_performance IS
  'Teacher dashboard view: Per-student performance breakdown by topic for targeted intervention';

-- View: Weak topics by student (for study plan generation)
CREATE OR REPLACE VIEW public.student_weak_topics AS
SELECT
  student_email,
  student_name,
  course_id,
  topic_id,
  topic_name,
  topic_score_percentage,
  (60.0 - topic_score_percentage) as gap_size,
  form_id,
  completed_at
FROM public.student_topic_performance
WHERE topic_score_percentage < 60.0
ORDER BY student_email, gap_size DESC;

COMMENT ON VIEW public.student_weak_topics IS
  'Study plan generation view: Topics where students scored below 60% threshold';

-- ============================================
-- SECTION 10: Utility Functions
-- ============================================

-- Function to calculate session score
CREATE OR REPLACE FUNCTION public.calculate_session_score(session_uuid uuid)
RETURNS void AS $$
DECLARE
  total integer;
  correct integer;
  score numeric(5,2);
BEGIN
  -- Count total and correct responses
  SELECT
    COUNT(*),
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)
  INTO total, correct
  FROM public.responses
  WHERE session_id = session_uuid;

  -- Calculate percentage
  IF total > 0 THEN
    score := (correct::numeric / total::numeric) * 100;
  ELSE
    score := 0;
  END IF;

  -- Update session
  UPDATE public.form_sessions
  SET
    total_questions = total,
    correct_answers = correct,
    score_percentage = score,
    completed_at = CASE WHEN completed_at IS NULL THEN NOW() ELSE completed_at END
  WHERE id = session_uuid;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_session_score IS
  'Calculates and updates score for a form session based on responses';

-- Function to check if slug is available
CREATE OR REPLACE FUNCTION public.is_slug_available(check_slug character varying)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.forms WHERE slug = check_slug
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.is_slug_available IS
  'Checks if a form slug is available for use';

-- Commit transaction
COMMIT;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This migration:
-- ✓ Removes redundant textbook_library tables
-- ✓ Removes unused verification_quizzes tables
-- ✓ Cleans up study_plans redundant columns
-- ✓ Adds form_sessions table for student submissions
-- ✓ Adds slug support to forms table
-- ✓ Links responses to sessions
-- ✓ Creates helpful views and functions
--
-- After running:
-- 1. Verify views work: SELECT * FROM form_submission_summary LIMIT 5;
-- 2. Test form session creation
-- 3. Verify responses link to sessions
-- 4. Check that no application code references dropped tables
-- ============================================
