-- ============================================================
-- Teacher Tracking - Schema Extension
-- Adds teacher support and teacher-student relationships
-- ============================================================

-- ============================================================
-- TEACHERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    external_id VARCHAR(255), -- For integration with LMS
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_external ON teachers(external_id);

COMMENT ON TABLE teachers IS 'Teachers who create and manage diagnostic forms';

-- ============================================================
-- UPDATE FORMS TABLE
-- ============================================================

-- Add teacher_id to forms
ALTER TABLE forms ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_forms_teacher ON forms(teacher_id);

COMMENT ON COLUMN forms.teacher_id IS 'Teacher who created this form';

-- ============================================================
-- TEACHER-STUDENT RELATIONSHIPS
-- ============================================================

CREATE TABLE IF NOT EXISTS teacher_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher ON teacher_students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_students_student ON teacher_students(student_id);

COMMENT ON TABLE teacher_students IS 'Maps students to teachers (created when student submits a teacher form)';

-- ============================================================
-- FUNCTION TO AUTO-LINK STUDENT TO TEACHER
-- ============================================================

-- Function to link student to teacher when they submit a form
CREATE OR REPLACE FUNCTION link_student_to_teacher()
RETURNS TRIGGER AS $$
DECLARE
    form_teacher_id UUID;
BEGIN
    -- Get teacher_id from the form
    SELECT teacher_id INTO form_teacher_id
    FROM forms
    WHERE id = NEW.form_id;

    -- If form has a teacher and session has a student, create relationship
    IF form_teacher_id IS NOT NULL AND NEW.student_id IS NOT NULL THEN
        INSERT INTO teacher_students (teacher_id, student_id)
        VALUES (form_teacher_id, NEW.student_id)
        ON CONFLICT (teacher_id, student_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-link student to teacher when form_session is created
DROP TRIGGER IF EXISTS trigger_link_student_to_teacher ON form_sessions;
CREATE TRIGGER trigger_link_student_to_teacher
    AFTER INSERT ON form_sessions
    FOR EACH ROW
    EXECUTE FUNCTION link_student_to_teacher();

COMMENT ON FUNCTION link_student_to_teacher IS 'Automatically creates teacher-student relationship when student submits form';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for development" ON teachers FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON teacher_students FOR ALL USING (true);

-- ============================================================
-- VIEWS FOR TEACHER ANALYTICS
-- ============================================================

-- View: Teacher's students and their performance
CREATE OR REPLACE VIEW teacher_student_overview AS
SELECT
    t.id AS teacher_id,
    t.email AS teacher_email,
    t.name AS teacher_name,
    s.id AS student_id,
    s.email AS student_email,
    s.name AS student_name,
    COUNT(DISTINCT fs.id) AS total_submissions,
    COUNT(DISTINCT fs.form_id) AS forms_completed,
    ROUND(AVG(fs.score_percentage), 2) AS avg_score,
    MAX(fs.completed_at) AS last_submission
FROM teachers t
JOIN teacher_students ts ON t.id = ts.teacher_id
JOIN students s ON ts.student_id = s.id
LEFT JOIN form_sessions fs ON s.id = fs.student_id AND fs.completed_at IS NOT NULL
GROUP BY t.id, t.email, t.name, s.id, s.email, s.name;

COMMENT ON VIEW teacher_student_overview IS 'Overview of each teacher students and their performance';

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '✓ Teacher tracking schema extension applied successfully';
    RAISE NOTICE '  - Created teachers table';
    RAISE NOTICE '  - Added teacher_id to forms';
    RAISE NOTICE '  - Created teacher_students relationship table';
    RAISE NOTICE '  - Added auto-linking trigger';
    RAISE NOTICE '  - Created teacher analytics views';
END $$;
