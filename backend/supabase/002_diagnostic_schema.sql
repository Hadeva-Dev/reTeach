-- ============================================================
-- Diagnostic Learning System - Database Schema Extension
-- ============================================================

-- ============================================================
-- RESOURCES (Textbooks, Assignments, etc.)
-- ============================================================

CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('textbook', 'assignment', 'slides', 'other')),
    file_path TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size_mb DECIMAL(10,2),
    total_pages INTEGER,
    metadata JSONB DEFAULT '{}', -- Author, edition, ISBN, etc.
    indexed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resources_course ON resources(course_id);
CREATE INDEX idx_resources_type ON resources(resource_type);
CREATE INDEX idx_resources_indexed ON resources(indexed);

COMMENT ON TABLE resources IS 'Uploaded learning resources (textbooks, assignments, slides)';

-- ============================================================
-- RESOURCE PAGES (Extracted content for search)
-- ============================================================

CREATE TABLE resource_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    content TEXT, -- Extracted text from page
    word_count INTEGER,
    has_images BOOLEAN DEFAULT false,
    has_tables BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}', -- Headers, footers, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resource_id, page_number)
);

CREATE INDEX idx_resource_pages_resource ON resource_pages(resource_id);
CREATE INDEX idx_resource_pages_number ON resource_pages(resource_id, page_number);

-- Full-text search index
CREATE INDEX idx_resource_pages_content_fts ON resource_pages
    USING gin(to_tsvector('english', content));

COMMENT ON TABLE resource_pages IS 'Page-level content from resources for searchability';

-- ============================================================
-- DIAGNOSTIC SURVEYS
-- ============================================================

CREATE TABLE diagnostic_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL, -- Array of survey question objects
    total_questions INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_surveys_course ON diagnostic_surveys(course_id);

COMMENT ON TABLE diagnostic_surveys IS 'Yes/No diagnostic surveys for knowledge assessment';

-- ============================================================
-- SURVEY RESPONSES
-- ============================================================

CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES diagnostic_surveys(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    student_email VARCHAR(255), -- Denormalized
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL, -- e.g., "sq_001"
    question_text TEXT NOT NULL,
    answer BOOLEAN NOT NULL, -- Yes = true, No = false
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_student ON survey_responses(student_id);
CREATE INDEX idx_survey_responses_topic ON survey_responses(topic_id);

-- Composite index for gap analysis queries
CREATE INDEX idx_survey_responses_survey_topic ON survey_responses(survey_id, topic_id);

COMMENT ON TABLE survey_responses IS 'Student answers to diagnostic survey questions';

-- ============================================================
-- STUDY PLANS
-- ============================================================

CREATE TABLE study_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    survey_id UUID REFERENCES diagnostic_surveys(id) ON DELETE SET NULL,
    title VARCHAR(255),
    weak_topics JSONB NOT NULL, -- Array of weak topic objects with scores
    plan_data JSONB NOT NULL, -- Full study plan structure (steps, resources, etc.)
    estimated_minutes INTEGER, -- Total estimated study time
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'abandoned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_study_plans_course ON study_plans(course_id);
CREATE INDEX idx_study_plans_student ON study_plans(student_id);
CREATE INDEX idx_study_plans_survey ON study_plans(survey_id);
CREATE INDEX idx_study_plans_status ON study_plans(status);

COMMENT ON TABLE study_plans IS 'Personalized study plans based on diagnostic results';

-- ============================================================
-- READING ASSIGNMENTS
-- ============================================================

CREATE TABLE reading_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    assignment_type VARCHAR(20) CHECK (assignment_type IN ('reading', 'practice', 'video', 'other')),
    page_start INTEGER,
    page_end INTEGER,
    page_count INTEGER GENERATED ALWAYS AS (page_end - page_start + 1) STORED,
    section_reference VARCHAR(255), -- e.g., "Section 3.2"
    problems_assigned TEXT, -- e.g., "#1-10, #15-20"
    key_concepts JSONB, -- Array of strings
    estimated_minutes INTEGER,
    why_relevant TEXT, -- Explanation for student
    order_index INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reading_assignments_plan ON reading_assignments(study_plan_id);
CREATE INDEX idx_reading_assignments_resource ON reading_assignments(resource_id);
CREATE INDEX idx_reading_assignments_topic ON reading_assignments(topic_id);
CREATE INDEX idx_reading_assignments_order ON reading_assignments(study_plan_id, order_index);

-- Constraint: page_start must be <= page_end
ALTER TABLE reading_assignments ADD CONSTRAINT valid_page_range
    CHECK (page_start IS NULL OR page_end IS NULL OR page_start <= page_end);

COMMENT ON TABLE reading_assignments IS 'Specific reading and practice assignments within study plans';

-- ============================================================
-- VERIFICATION QUIZZES
-- ============================================================

CREATE TABLE verification_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    question_count INTEGER DEFAULT 10,
    focus_topics JSONB NOT NULL, -- Array of topic IDs
    quiz_data JSONB NOT NULL, -- Full quiz structure with questions
    passing_score INTEGER DEFAULT 70, -- Percentage
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_quizzes_plan ON verification_quizzes(study_plan_id);
CREATE INDEX idx_verification_quizzes_status ON verification_quizzes(status);

COMMENT ON TABLE verification_quizzes IS 'Post-study assessment quizzes to verify learning';

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES verification_quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    answers JSONB NOT NULL, -- Array of {question_id, selected_index, is_correct}
    score_percentage DECIMAL(5,2), -- 0.00 to 100.00
    passed BOOLEAN,
    time_spent_seconds INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);

COMMENT ON TABLE quiz_attempts IS 'Student attempts at verification quizzes';

-- ============================================================
-- VIEWS FOR ANALYTICS
-- ============================================================

-- View: Knowledge Gap Summary per Student
CREATE VIEW knowledge_gaps AS
SELECT
    sr.survey_id,
    sr.student_id,
    sr.student_email,
    sr.topic_id,
    t.name AS topic_name,
    COUNT(sr.id) AS total_questions,
    SUM(CASE WHEN sr.answer = true THEN 1 ELSE 0 END) AS correct_answers,
    ROUND(AVG(CASE WHEN sr.answer = true THEN 100.0 ELSE 0.0 END), 2) AS score_percentage,
    CASE
        WHEN AVG(CASE WHEN sr.answer = true THEN 100.0 ELSE 0.0 END) >= 60 THEN 'strong'
        ELSE 'weak'
    END AS proficiency_level
FROM survey_responses sr
JOIN topics t ON sr.topic_id = t.id
GROUP BY sr.survey_id, sr.student_id, sr.student_email, sr.topic_id, t.name;

COMMENT ON VIEW knowledge_gaps IS 'Summarized knowledge gap analysis per student per topic';

-- View: Study Plan Progress
CREATE VIEW study_plan_progress AS
SELECT
    sp.id AS study_plan_id,
    sp.student_id,
    sp.status AS plan_status,
    COUNT(ra.id) AS total_assignments,
    SUM(CASE WHEN ra.completed THEN 1 ELSE 0 END) AS completed_assignments,
    ROUND(AVG(CASE WHEN ra.completed THEN 100.0 ELSE 0.0 END), 2) AS completion_percentage,
    SUM(ra.estimated_minutes) AS total_minutes,
    SUM(CASE WHEN ra.completed THEN ra.estimated_minutes ELSE 0 END) AS minutes_spent
FROM study_plans sp
LEFT JOIN reading_assignments ra ON sp.id = ra.study_plan_id
GROUP BY sp.id, sp.student_id, sp.status;

COMMENT ON VIEW study_plan_progress IS 'Progress tracking for study plans';

-- View: Verification Quiz Results
CREATE VIEW quiz_results AS
SELECT
    vq.id AS quiz_id,
    vq.study_plan_id,
    qa.student_id,
    qa.score_percentage,
    qa.passed,
    vq.question_count,
    qa.time_spent_seconds,
    qa.completed_at
FROM verification_quizzes vq
LEFT JOIN quiz_attempts qa ON vq.id = qa.quiz_id
WHERE qa.completed_at IS NOT NULL;

COMMENT ON VIEW quiz_results IS 'Completed quiz attempts with scores';

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at for resources
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for study_plans
CREATE TRIGGER update_study_plans_updated_at BEFORE UPDATE ON study_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (Development mode - allow all)
-- ============================================================

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for development" ON resources FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON resource_pages FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON diagnostic_surveys FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON survey_responses FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON study_plans FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON reading_assignments FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON verification_quizzes FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON quiz_attempts FOR ALL USING (true);

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

-- Function to get weak topics for a student
CREATE OR REPLACE FUNCTION get_weak_topics(survey_uuid UUID, min_score DECIMAL DEFAULT 60.0)
RETURNS TABLE (
    topic_id UUID,
    topic_name VARCHAR,
    score_percentage NUMERIC,
    total_questions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        kg.topic_id,
        kg.topic_name,
        kg.score_percentage,
        kg.total_questions
    FROM knowledge_gaps kg
    WHERE kg.survey_id = survey_uuid
      AND kg.score_percentage < min_score
    ORDER BY kg.score_percentage ASC, kg.topic_name ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to search resource pages by keyword
CREATE OR REPLACE FUNCTION search_resource_pages(
    resource_uuid UUID,
    search_query TEXT,
    max_results INT DEFAULT 10
)
RETURNS TABLE (
    page_number INT,
    content TEXT,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        rp.page_number,
        rp.content,
        ts_rank(to_tsvector('english', rp.content), plainto_tsquery('english', search_query)) AS relevance
    FROM resource_pages rp
    WHERE rp.resource_id = resource_uuid
      AND to_tsvector('english', rp.content) @@ plainto_tsquery('english', search_query)
    ORDER BY relevance DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

-- Insert sample resource
INSERT INTO resources (id, course_id, title, resource_type, file_path, total_pages)
VALUES (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001', -- Sample course from initial schema
    'Stewart Calculus (8th Edition)',
    'textbook',
    '/uploads/stewart_calculus_8e.pdf',
    892
) ON CONFLICT DO NOTHING;

-- Insert sample diagnostic survey
INSERT INTO diagnostic_surveys (id, course_id, title, questions, total_questions)
VALUES (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000001',
    'Calculus I Diagnostic',
    '[
        {
            "id": "sq_001",
            "topic_id": "t_001",
            "text": "Can you evaluate a limit using direct substitution?",
            "cognitive_level": "apply"
        },
        {
            "id": "sq_002",
            "topic_id": "t_002",
            "text": "Can you find the derivative of x^3?",
            "cognitive_level": "apply"
        }
    ]'::jsonb,
    2
) ON CONFLICT DO NOTHING;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- GIN indexes for JSONB columns
CREATE INDEX idx_resources_metadata_gin ON resources USING GIN (metadata);
CREATE INDEX idx_surveys_questions_gin ON diagnostic_surveys USING GIN (questions);
CREATE INDEX idx_study_plans_data_gin ON study_plans USING GIN (plan_data);
CREATE INDEX idx_study_plans_weak_topics_gin ON study_plans USING GIN (weak_topics);
CREATE INDEX idx_reading_key_concepts_gin ON reading_assignments USING GIN (key_concepts);

-- ============================================================
-- COMPLETION
-- ============================================================

-- Verify all tables were created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
          'resources',
          'resource_pages',
          'diagnostic_surveys',
          'survey_responses',
          'study_plans',
          'reading_assignments',
          'verification_quizzes',
          'quiz_attempts'
      );

    IF table_count = 8 THEN
        RAISE NOTICE '✓ All 8 diagnostic system tables created successfully';
    ELSE
        RAISE WARNING 'Expected 8 tables, found %', table_count;
    END IF;
END $$;
