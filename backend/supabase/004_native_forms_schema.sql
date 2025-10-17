-- ============================================================
-- Native Forms System - Schema Extension
-- Adds shareable slugs and student session tracking
-- ============================================================

-- ============================================================
-- UPDATE FORMS TABLE
-- ============================================================

-- Add slug column for shareable URLs
ALTER TABLE forms ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Add index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);

-- Update form_url to be nullable (no longer using Google Forms)
ALTER TABLE forms ALTER COLUMN form_url DROP NOT NULL;
ALTER TABLE forms ALTER COLUMN sheet_url DROP NOT NULL;

COMMENT ON COLUMN forms.slug IS 'URL-safe unique identifier for shareable form links (e.g., "calculus-midterm-a3f2")';

-- ============================================================
-- FORM SESSIONS (Student Submissions)
-- ============================================================

CREATE TABLE IF NOT EXISTS form_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,

    -- Session tracking
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER,

    -- Analytics (optional)
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Scoring
    total_questions INTEGER,
    correct_answers INTEGER,
    score_percentage DECIMAL(5,2),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_form_sessions_form ON form_sessions(form_id);
CREATE INDEX idx_form_sessions_student ON form_sessions(student_id);
CREATE INDEX idx_form_sessions_email ON form_sessions(student_email);
CREATE INDEX idx_form_sessions_completed ON form_sessions(completed_at DESC NULLS LAST);

COMMENT ON TABLE form_sessions IS 'Tracks individual student form submission sessions';

-- ============================================================
-- UPDATE RESPONSES TABLE
-- ============================================================

-- Link responses to sessions
ALTER TABLE responses ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES form_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_responses_session ON responses(session_id);

COMMENT ON COLUMN responses.session_id IS 'Links response to student form session';

-- ============================================================
-- VIEWS FOR NATIVE FORMS ANALYTICS
-- ============================================================

-- View: Form submission summary
CREATE OR REPLACE VIEW form_submission_stats AS
SELECT
    f.id AS form_id,
    f.slug,
    f.title,
    f.status,
    COUNT(DISTINCT fs.id) AS total_submissions,
    COUNT(DISTINCT fs.id) FILTER (WHERE fs.completed_at IS NOT NULL) AS completed_submissions,
    COUNT(DISTINCT fs.student_email) AS unique_students,
    ROUND(AVG(fs.score_percentage), 2) AS avg_score,
    MIN(fs.score_percentage) AS min_score,
    MAX(fs.score_percentage) AS max_score,
    MIN(fs.completed_at) AS first_submission,
    MAX(fs.completed_at) AS last_submission
FROM forms f
LEFT JOIN form_sessions fs ON f.id = fs.form_id
GROUP BY f.id, f.slug, f.title, f.status;

COMMENT ON VIEW form_submission_stats IS 'Aggregate statistics per published form';

-- View: Student performance with weak topics
CREATE OR REPLACE VIEW student_form_performance AS
SELECT
    fs.id AS session_id,
    fs.form_id,
    f.title AS form_title,
    fs.student_name,
    fs.student_email,
    fs.completed_at,
    fs.score_percentage,
    fs.total_questions,
    fs.correct_answers,

    -- Aggregate weak topics (topics where student scored < 60%)
    COALESCE(
        json_agg(
            json_build_object(
                'topic_id', t.id,
                'topic_name', t.name,
                'correct', COUNT(r.id) FILTER (WHERE r.is_correct),
                'total', COUNT(r.id),
                'percentage', ROUND(AVG(CASE WHEN r.is_correct THEN 100.0 ELSE 0.0 END), 2)
            )
        ) FILTER (WHERE AVG(CASE WHEN r.is_correct THEN 100.0 ELSE 0.0 END) < 60),
        '[]'::json
    ) AS weak_topics
FROM form_sessions fs
JOIN forms f ON fs.form_id = f.id
LEFT JOIN responses r ON fs.id = r.session_id
LEFT JOIN topics t ON r.topic_id = t.id
WHERE fs.completed_at IS NOT NULL
GROUP BY fs.id, f.title, fs.student_name, fs.student_email, fs.completed_at,
         fs.score_percentage, fs.total_questions, fs.correct_answers;

COMMENT ON VIEW student_form_performance IS 'Student performance with identified weak topics';

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

-- Function to check if slug is available
CREATE OR REPLACE FUNCTION is_slug_available(check_slug VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM forms WHERE slug = check_slug
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get form by slug
CREATE OR REPLACE FUNCTION get_form_by_slug(form_slug VARCHAR)
RETURNS TABLE (
    form_id UUID,
    title VARCHAR,
    status VARCHAR,
    total_questions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id AS form_id,
        f.title,
        f.status,
        COUNT(fq.question_id) AS total_questions
    FROM forms f
    LEFT JOIN form_questions fq ON f.id = fq.form_id
    WHERE f.slug = form_slug AND f.status = 'published'
    GROUP BY f.id, f.title, f.status;
END;
$$ LANGUAGE plpgsql;

-- Function to get form questions by slug
CREATE OR REPLACE FUNCTION get_form_questions_by_slug(form_slug VARCHAR)
RETURNS TABLE (
    question_id UUID,
    question_code VARCHAR,
    topic_id UUID,
    topic_name VARCHAR,
    stem TEXT,
    options JSONB,
    difficulty VARCHAR,
    bloom_level VARCHAR,
    order_index INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id AS question_id,
        q.question_id AS question_code,
        q.topic_id,
        t.name AS topic_name,
        q.stem,
        q.options,
        q.difficulty,
        q.bloom_level,
        fq.order_index
    FROM forms f
    JOIN form_questions fq ON f.id = fq.form_id
    JOIN questions q ON fq.question_id = q.id
    JOIN topics t ON q.topic_id = t.id
    WHERE f.slug = form_slug AND f.status = 'published'
    ORDER BY fq.order_index;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate session score
CREATE OR REPLACE FUNCTION calculate_session_score(session_uuid UUID)
RETURNS VOID AS $$
DECLARE
    total INT;
    correct INT;
    score DECIMAL(5,2);
BEGIN
    -- Count total and correct responses
    SELECT
        COUNT(*),
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)
    INTO total, correct
    FROM responses
    WHERE session_id = session_uuid;

    -- Calculate percentage
    IF total > 0 THEN
        score := (correct::DECIMAL / total::DECIMAL) * 100;
    ELSE
        score := 0;
    END IF;

    -- Update session
    UPDATE form_sessions
    SET
        total_questions = total,
        correct_answers = correct,
        score_percentage = score,
        completed_at = CASE WHEN completed_at IS NULL THEN NOW() ELSE completed_at END
    WHERE id = session_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE form_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for development" ON form_sessions FOR ALL USING (true);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Add slug to existing sample form (if exists)
UPDATE forms
SET slug = 'sample-calculus-diagnostic-demo'
WHERE form_id = 'sample_form_001'
AND slug IS NULL;

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if slug column was added
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'forms'
        AND column_name = 'slug'
    ) INTO column_exists;

    IF column_exists THEN
        RAISE NOTICE '✓ Native forms schema extension applied successfully';
        RAISE NOTICE '  - Added slug column to forms';
        RAISE NOTICE '  - Created form_sessions table';
        RAISE NOTICE '  - Added session_id to responses';
        RAISE NOTICE '  - Created utility functions and views';
    ELSE
        RAISE WARNING '✗ Schema extension may not have applied correctly';
    END IF;
END $$;
