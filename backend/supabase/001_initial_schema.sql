-- ============================================================
-- EdTech Diagnostic Platform - Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- COURSES & SYLLABI
-- ============================================================

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    course_level VARCHAR(20) CHECK (course_level IN ('hs', 'ug', 'grad')),
    syllabus_text TEXT,
    syllabus_file_url TEXT,
    instructor_id UUID, -- If you add auth later
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_created ON courses(created_at DESC);

-- ============================================================
-- TOPICS
-- ============================================================

CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    topic_id VARCHAR(50) NOT NULL, -- e.g., "q_001", user-facing ID
    name VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) DEFAULT 1.0, -- Importance weighting
    order_index INTEGER DEFAULT 0, -- For display ordering
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, topic_id)
);

CREATE INDEX idx_topics_course ON topics(course_id);
CREATE INDEX idx_topics_order ON topics(course_id, order_index);

-- ============================================================
-- TOPIC PREREQUISITES (many-to-many)
-- ============================================================

CREATE TABLE topic_prerequisites (
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    prerequisite_topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (topic_id, prerequisite_topic_id),
    CHECK (topic_id != prerequisite_topic_id) -- No self-references
);

CREATE INDEX idx_prereqs_topic ON topic_prerequisites(topic_id);
CREATE INDEX idx_prereqs_prereq ON topic_prerequisites(prerequisite_topic_id);

-- ============================================================
-- QUESTIONS
-- ============================================================

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id VARCHAR(50) NOT NULL UNIQUE, -- e.g., "q_001"
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    stem TEXT NOT NULL, -- Question text
    options JSONB NOT NULL, -- Array of option strings
    answer_index INTEGER NOT NULL, -- 0-based index of correct answer
    rationale TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'med', 'hard')),
    bloom_level VARCHAR(50), -- e.g., "remember", "understand", "apply"
    metadata JSONB DEFAULT '{}', -- For extensibility
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_question_id ON questions(question_id);

-- Constraint: answer_index must be valid
ALTER TABLE questions ADD CONSTRAINT valid_answer_index
    CHECK (answer_index >= 0 AND answer_index < jsonb_array_length(options));

-- ============================================================
-- FORMS / ASSESSMENTS
-- ============================================================

CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id VARCHAR(100) UNIQUE NOT NULL, -- Google Form ID or internal ID
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    form_url TEXT, -- Google Form URL
    sheet_url TEXT, -- Google Sheets URL for responses
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
    publish_date TIMESTAMPTZ,
    close_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forms_course ON forms(course_id);
CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_forms_form_id ON forms(form_id);

-- ============================================================
-- FORM QUESTIONS (many-to-many: which questions are on which form)
-- ============================================================

CREATE TABLE form_questions (
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL, -- Order in the form
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (form_id, question_id)
);

CREATE INDEX idx_form_questions_form ON form_questions(form_id, order_index);

-- ============================================================
-- STUDENTS / RESPONDENTS
-- ============================================================

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    external_id VARCHAR(255), -- For integration with LMS
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_external ON students(external_id);

-- ============================================================
-- RESPONSES (normalized)
-- ============================================================

CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    student_email VARCHAR(255), -- Denormalized for easy access
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE, -- Denormalized
    selected_option_index INTEGER, -- What they answered
    is_correct BOOLEAN NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_responses_form ON responses(form_id);
CREATE INDEX idx_responses_student ON responses(student_id);
CREATE INDEX idx_responses_question ON responses(question_id);
CREATE INDEX idx_responses_topic ON responses(topic_id);
CREATE INDEX idx_responses_submitted ON responses(submitted_at DESC);

-- Composite index for common analytics queries
CREATE INDEX idx_responses_form_topic ON responses(form_id, topic_id);
CREATE INDEX idx_responses_form_student ON responses(form_id, student_id);

-- ============================================================
-- VIEWS FOR ANALYTICS
-- ============================================================

-- View: Topic-level statistics per form
CREATE VIEW topic_statistics AS
SELECT
    r.form_id,
    f.title AS form_title,
    r.topic_id,
    t.name AS topic_name,
    t.weight AS topic_weight,
    COUNT(DISTINCT r.student_id) AS num_students,
    COUNT(r.id) AS num_responses,
    SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) AS num_correct,
    ROUND(AVG(CASE WHEN r.is_correct THEN 100.0 ELSE 0.0 END), 2) AS correct_pct
FROM responses r
JOIN topics t ON r.topic_id = t.id
JOIN forms f ON r.form_id = f.id
GROUP BY r.form_id, f.title, r.topic_id, t.name, t.weight;

-- View: Student-level statistics per form
CREATE VIEW student_statistics AS
SELECT
    r.form_id,
    r.student_id,
    r.student_email,
    s.name AS student_name,
    COUNT(r.id) AS num_questions,
    SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) AS num_correct,
    ROUND(AVG(CASE WHEN r.is_correct THEN 100.0 ELSE 0.0 END), 2) AS score_pct,
    MIN(r.submitted_at) AS started_at,
    MAX(r.submitted_at) AS finished_at
FROM responses r
LEFT JOIN students s ON r.student_id = s.id
GROUP BY r.form_id, r.student_id, r.student_email, s.name;

-- View: Question difficulty analysis
CREATE VIEW question_statistics AS
SELECT
    q.id AS question_id,
    q.question_id AS question_code,
    q.stem,
    q.difficulty,
    q.bloom_level,
    t.name AS topic_name,
    COUNT(r.id) AS num_responses,
    SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) AS num_correct,
    ROUND(AVG(CASE WHEN r.is_correct THEN 100.0 ELSE 0.0 END), 2) AS correct_pct
FROM questions q
LEFT JOIN responses r ON q.id = r.question_id
JOIN topics t ON q.topic_id = t.id
GROUP BY q.id, q.question_id, q.stem, q.difficulty, q.bloom_level, t.name;

-- ============================================================
-- TRIGGERS FOR updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Enable but don't restrict yet
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you'll add auth policies later)
CREATE POLICY "Allow all for development" ON courses FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON topics FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON questions FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON forms FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON responses FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON students FOR ALL USING (true);

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

-- Insert a sample course
INSERT INTO courses (id, title, course_level, syllabus_text) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Calculus I', 'ug', 'Introduction to limits, derivatives, and integrals...');

-- Insert sample topics
INSERT INTO topics (id, course_id, topic_id, name, weight, order_index) VALUES
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 't_001', 'Limits', 1.2, 1),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 't_002', 'Derivatives', 1.5, 2),
    ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 't_003', 'Chain Rule', 1.0, 3),
    ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 't_004', 'Integration', 1.3, 4);

-- Insert topic prerequisites (Derivatives requires Limits)
INSERT INTO topic_prerequisites (topic_id, prerequisite_topic_id) VALUES
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000011'),
    ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000012');

-- Insert sample question
INSERT INTO questions (question_id, topic_id, stem, options, answer_index, rationale, difficulty, bloom_level) VALUES
    ('q_001', '00000000-0000-0000-0000-000000000011',
     'What is lim_{x→0} (sin x)/x ?',
     '["0", "1", "x", "Does not exist"]',
     1,
     'Standard limit = 1.',
     'easy',
     'remember');

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

-- Function to get topic statistics for a specific form
CREATE OR REPLACE FUNCTION get_form_topic_stats(form_uuid UUID)
RETURNS TABLE (
    topic_id UUID,
    topic_name VARCHAR,
    num_students BIGINT,
    num_questions BIGINT,
    correct_pct NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ts.topic_id,
        ts.topic_name,
        ts.num_students,
        ts.num_responses AS num_questions,
        ts.correct_pct
    FROM topic_statistics ts
    WHERE ts.form_id = form_uuid
    ORDER BY ts.correct_pct ASC; -- Weakest topics first
END;
$$ LANGUAGE plpgsql;

-- Function to get student performance for a specific form
CREATE OR REPLACE FUNCTION get_form_student_stats(form_uuid UUID)
RETURNS TABLE (
    student_id UUID,
    student_email VARCHAR,
    student_name VARCHAR,
    num_questions BIGINT,
    score_pct NUMERIC,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ss.student_id,
        ss.student_email,
        ss.student_name,
        ss.num_questions,
        ss.score_pct,
        ss.started_at,
        ss.finished_at
    FROM student_statistics ss
    WHERE ss.form_id = form_uuid
    ORDER BY ss.score_pct DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- GIN index for JSONB columns (for filtering options, metadata)
CREATE INDEX idx_questions_options_gin ON questions USING GIN (options);
CREATE INDEX idx_questions_metadata_gin ON questions USING GIN (metadata);

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE courses IS 'Stores course information and uploaded syllabi';
COMMENT ON TABLE topics IS 'Extracted topics from course syllabi with weights';
COMMENT ON TABLE topic_prerequisites IS 'Defines prerequisite relationships between topics';
COMMENT ON TABLE questions IS 'Question bank with MCQ details';
COMMENT ON TABLE forms IS 'Published diagnostic assessments';
COMMENT ON TABLE form_questions IS 'Links questions to specific forms';
COMMENT ON TABLE responses IS 'Normalized student responses to questions';
COMMENT ON TABLE students IS 'Student/respondent information';

COMMENT ON VIEW topic_statistics IS 'Aggregated statistics per topic per form';
COMMENT ON VIEW student_statistics IS 'Aggregated statistics per student per form';
COMMENT ON VIEW question_statistics IS 'Aggregated difficulty analysis per question';
