<div align="center">
  <img src="./public/logo.png" alt="reTeach Logo" width="200"/>

  # reTeach

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-black)](https://nextjs.org/)
  [![Powered by FastAPI](https://img.shields.io/badge/Powered%20by-FastAPI-009688)](https://fastapi.tiangolo.com/)
  [![Built with Cool Vibes](https://img.shields.io/badge/Built%20with-Cool%20Vibes-ff69b4)](https://github.com/Hadeva-Dev/reTeach)
  [![Made by Hao & Dennis](https://img.shields.io/badge/Made%20by-Hao%20%26%20Dennis-orange)](https://github.com/Hadeva-Dev/reTeach)

  ### Intelligent diagnostic assessment platform for educators
</div>

Transform your course syllabus into personalized diagnostic assessments in minutes. Using AI, reTeach generates topic-specific questions, analyzes student performance, and automatically sends tailored study resources via email.

---

## Why reTeach?

Teachers spend **countless hours** creating diagnostic assessments to identify student knowledge gaps, then even more time finding appropriate resources for each struggling student. This manual process is time-consuming, inconsistent, and often delayed.

reTeach automates this entire workflow:
- **Saves Time**: What takes hours manually now takes minutes
- **Personalized Learning**: Every student receives targeted resources for their specific weak areas
- **Data-Driven**: Teachers get instant analytics on class-wide knowledge gaps
- **Immediate Feedback**: Students receive study materials instantly via email, not days later

Built after conversations with educators who needed a better way to diagnose and support student learning at scale.

---

## Features

- **AI-Powered Question Generation** - Automatically creates diagnostic questions from your syllabus
- **Real-Time Analytics** - Track student performance by topic with interactive dashboards
- **Automated Study Resources** - Students receive personalized Khan Academy links for weak topics
- **Topic-Based Analysis** - Identify knowledge gaps across your entire course
- **Easy Sharing** - Share assessments via link or QR code
- **Mobile Friendly** - Works seamlessly on any device

---

## Workflow

### 1. Upload Syllabus & Extract Topics

Upload your course syllabus and let AI extract the main topics and structure.

![Upload & Extract](./docs/images/uploadsyllabusextract.png)

---

### 2. Review Topics

Review and customize the extracted topics before generating questions.

![Review Topics](./docs/images/reviewtopics.png)

---

### 3. Preview Questions

AI generates 3 questions per topic. Review and edit as needed.

![Preview Questions](./docs/images/previewquestions.png)

---

### 4. Publish & Share

Publish your diagnostic and share it with students via link or QR code.

![Form Published](./docs/images/formpublished.png)

---

### 5. Student Experience

Students complete the assessment with a clean, simple interface.

![Diagnostic Assessment](./docs/images/diagnosticassessment1.png)

![Diagnostic Assessment Continued](./docs/images/diagnosticassessment2.png)

---

### 6. Automated Feedback

Students receive personalized study resources via email immediately after submission.

![Student Feedback](./docs/images/studentfeedback.png)

---

### 7. View Results

Access comprehensive analytics showing performance by topic and identifying weak areas.

![Results Dashboard](./docs/images/resultsdashboard.png)

![Student Response Analysis](./docs/images/studentresponseanalysis.png)

---

## Technology Stack

**Frontend**
- Next.js 15 (React 18)
- TypeScript
- Tailwind CSS
- Recharts (Data visualization)
- React Hook Form (Form management)
- Zod (Schema validation)

**Backend**
- FastAPI (Python 3.10+)
- Supabase (PostgreSQL database)
- Anthropic Claude (AI model)
- SendGrid / SMTP (Email delivery)
- Pydantic (Data validation)
- Python-Multipart (File uploads)

---

## App Architecture

reTeach follows a modern full-stack architecture with clear separation of concerns, implementing a three-tier architecture pattern with dedicated layers for presentation, business logic, and data persistence.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              Next.js 15 Frontend                              │ │
│  │                                                               │ │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │  Server         │  │  Client      │  │  API Routes     │ │ │
│  │  │  Components     │  │  Components  │  │  (Middleware)   │ │ │
│  │  │  • SSR          │  │  • Hooks     │  │  • Auth proxy   │ │ │
│  │  │  • Data fetch   │  │  • Forms     │  │  • CORS handler │ │ │
│  │  └─────────────────┘  └──────────────┘  └─────────────────┘ │ │
│  │                                                               │ │
│  │  ┌───────────────────────────────────────────────────────┐   │ │
│  │  │  State Management & Data Layer                       │   │ │
│  │  │  • React Context (UI state)                          │   │ │
│  │  │  • SWR/React Query (Server state caching)            │   │ │
│  │  │  • Zod schemas (Client-side validation)              │   │ │
│  │  └───────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    HTTPS/TLS (JWT Bearer Token)
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                          API LAYER                                  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              FastAPI Backend                                  │ │
│  │                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  Middleware Stack                                       │ │ │
│  │  │  • CORS (Cross-Origin Resource Sharing)                 │ │ │
│  │  │  • Rate Limiting (SlowAPI)                              │ │ │
│  │  │  • Request Validation (Pydantic)                        │ │ │
│  │  │  • Error Handler (Global exception catching)            │ │ │
│  │  │  • Authentication (JWT verification)                    │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │ │
│  │  │  Routers     │  │  Services    │  │  Models/Schemas  │   │ │
│  │  │  • /syllabus │  │  • AI svc    │  │  • Pydantic      │   │ │
│  │  │  • /diag     │  │  • Email svc │  │  • Type safety   │   │ │
│  │  │  • /response │  │  • DB svc    │  │  • Validation    │   │ │
│  │  │  • /results  │  │  • Auth svc  │  │                  │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
    ┌──────────────────┐ ┌─────────────────┐ ┌────────────────┐
    │   Supabase       │ │   Anthropic     │ │   SendGrid     │
    │   (PostgreSQL)   │ │   Claude API    │ │   Email API    │
    │                  │ │                 │ │                │
    │  • Auth (RLS)    │ │  • Prompt eng   │ │  • Templates   │
    │  • Database      │ │  • Streaming    │ │  • Delivery    │
    │  • Storage       │ │  • JSON mode    │ │  • Tracking    │
    │  • Realtime      │ │  • Rate limits  │ │  • Bounce mgmt │
    └──────────────────┘ └─────────────────┘ └────────────────┘
     DATA LAYER          AI SERVICES         EMAIL SERVICES
```

### Data Flow

#### 1. Diagnostic Creation Flow
```
Teacher → Upload Syllabus → FastAPI → Claude AI → Extract Topics
                                  ↓
                            Store in Supabase
                                  ↓
Teacher → Review/Edit Topics → Generate Questions (Claude)
                                  ↓
                            Store Assessment in DB
                                  ↓
                        Generate Shareable Link/QR
```

#### 2. Student Assessment Flow
```
Student → Access Link → Fetch Questions (Supabase)
              ↓
        Answer Questions
              ↓
        Submit → FastAPI → Calculate Score by Topic
                    ↓
              Store Results (Supabase)
                    ↓
              Generate Resources (Khan Academy links)
                    ↓
              Send Email (SendGrid) → Student Inbox
```

#### 3. Results & Analytics Flow
```
Teacher → View Results Dashboard → Supabase → Aggregate Performance
                                         ↓
                                  Display Charts
                                  • Topic breakdown
                                  • Individual responses
                                  • Weak area identification
```

### Key Components

**Frontend Architecture**
- **App Router**: Next.js 15 app directory structure with server/client components
- **UI Components**: Reusable React components with Tailwind CSS
- **API Client**: Centralized HTTP client for backend communication
- **State Management**: React hooks and server-side state
- **Real-time Updates**: Dynamic data fetching and revalidation

**Backend Architecture**

*Router Layer*: FastAPI routers implementing RESTful endpoints
- `/api/v1/syllabus`: AI-powered topic extraction from uploaded files
  - `POST /upload`: Accepts PDF/DOCX, returns extracted topics
  - `POST /extract`: Manual topic extraction with custom prompts
- `/api/v1/diagnostics`: CRUD operations for assessments
  - `POST /create`: Initialize new diagnostic
  - `GET /{id}`: Fetch diagnostic with questions
  - `PUT /{id}`: Update questions/topics
  - `DELETE /{id}`: Soft delete diagnostic
  - `POST /{id}/publish`: Generate shareable link
- `/api/v1/responses`: Student submission handling
  - `POST /submit`: Process student answers
  - `GET /{diagnostic_id}`: Fetch all responses for a diagnostic
- `/api/v1/results`: Analytics and reporting
  - `GET /{diagnostic_id}/aggregate`: Topic-level performance
  - `GET /{diagnostic_id}/individual/{student_id}`: Student details
  - `POST /{diagnostic_id}/export`: CSV/JSON export

*Service Layer*: Business logic and third-party integrations
- **AI Service** (`ai_service.py`)
  - Claude API integration with prompt engineering
  - Topic extraction from unstructured text
  - Question generation (3 per topic, multiple choice)
  - Retry logic with exponential backoff
  - Streaming response handling
- **Email Service** (`email_service.py`)
  - SendGrid API integration
  - HTML email templates with Jinja2
  - Personalized resource link generation (Khan Academy)
  - Batch email sending for class notifications
  - Delivery status tracking
- **Database Service** (`db_service.py`)
  - Supabase client wrapper
  - Query optimization and connection pooling
  - Transaction management
  - Row-level security (RLS) enforcement
- **Auth Service** (`auth_service.py`)
  - JWT token validation
  - User role management (teacher/student)
  - Session management

*Models Layer*: Data validation and type safety
- Pydantic models for request/response schemas
- Database ORM models
- Enum definitions for question types, user roles
- Custom validators for email, URLs, file types

*Utilities*: Helper functions
- File processing (PDF/DOCX parsing)
- Khan Academy topic mapping
- Analytics calculations
- Error handling and logging

**Database Schema (Supabase PostgreSQL)**

*Core Tables*:
- `users`: User accounts with role-based access
  - Fields: id, email, role (teacher/student), created_at
  - RLS: Users can only access their own data
- `diagnostics`: Assessment metadata
  - Fields: id, creator_id, title, description, syllabus_text, published, shareable_link, created_at
  - RLS: Teachers own diagnostics, students read-only via link
- `topics`: Extracted course topics
  - Fields: id, diagnostic_id, topic_name, order, created_at
  - Relation: Many topics per diagnostic
- `questions`: Generated assessment questions
  - Fields: id, topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer, created_at
  - Relation: 3 questions per topic (enforced via trigger)
- `responses`: Student submissions
  - Fields: id, diagnostic_id, student_email, student_name, submitted_at, total_score
  - RLS: Students can only see their own responses
- `answers`: Individual question answers
  - Fields: id, response_id, question_id, selected_answer, is_correct
  - Relation: One answer per question per response
- `performance_metrics`: Aggregated topic-level scores
  - Fields: id, response_id, topic_id, score, total_questions, weak_area (boolean)
  - Automatically calculated via database trigger on answer insert

*Indexes for Performance*:
- `idx_diagnostics_creator`: Fast lookup of teacher's diagnostics
- `idx_diagnostics_shareable_link`: Quick access via public link
- `idx_responses_diagnostic`: Aggregate all responses for analytics
- `idx_answers_response`: Fast answer retrieval per submission

*Database Triggers*:
- `calculate_performance_on_submit`: Auto-calculate topic scores when response submitted
- `enforce_question_limit`: Prevent more than 3 questions per topic
- `update_diagnostic_modified_at`: Track last modification time

### Integration Points

1. **Frontend ↔ Backend**: REST API over HTTP/HTTPS
2. **Backend ↔ Supabase**: PostgreSQL client via Supabase SDK
3. **Backend ↔ Claude**: Anthropic API for AI operations
4. **Backend ↔ SendGrid**: Email API for automated feedback
5. **Frontend ↔ Supabase**: Direct auth and real-time subscriptions (optional)

### Performance Optimization

**Frontend Performance**:
- **Server-Side Rendering (SSR)**: Next.js pre-renders pages for faster initial load
- **Static Site Generation (SSG)**: Public pages generated at build time
- **Image Optimization**: Next.js Image component with lazy loading and WebP conversion
- **Code Splitting**: Automatic route-based splitting reduces bundle size
- **Caching Strategy**:
  - SWR for client-side data caching with stale-while-revalidate
  - ISR (Incremental Static Regeneration) for semi-dynamic content
- **CDN Delivery**: Edge network distribution for global low latency
- **Bundle Analysis**: Regular monitoring to keep JavaScript payload minimal

**Backend Performance**:
- **Connection Pooling**: Supabase connection pool (max 20 connections)
- **Query Optimization**:
  - Indexed queries on foreign keys
  - Materialized views for complex analytics
  - EXPLAIN ANALYZE for query profiling
- **Caching Layer**: Redis for frequently accessed data (upcoming)
- **Async Processing**:
  - FastAPI async/await for I/O operations
  - Background tasks for email sending (non-blocking)
- **Rate Limiting**:
  - 100 requests/minute per IP for public endpoints
  - 1000 requests/minute for authenticated users
- **Database Triggers**: Server-side calculation reduces round-trips
- **Batch Operations**: Bulk insert for multiple questions/responses

---

## Security

reTeach implements multiple layers of security to protect user data, prevent unauthorized access, and ensure compliance with educational privacy standards.

### Authentication & Authorization

**Multi-Layer Authentication**:
- **Supabase Auth**: OAuth 2.0 and JWT-based authentication
  - Google OAuth for streamlined teacher login
  - Magic link email authentication (passwordless)
  - Session management with automatic token refresh
- **JWT Token Validation**: Backend verifies tokens on every protected endpoint
  - Token expiry: 1 hour (access token), 7 days (refresh token)
  - Signature verification using RS256 algorithm
  - Claims validation (issuer, audience, expiration)
- **Role-Based Access Control (RBAC)**:
  - `teacher` role: Full CRUD on own diagnostics, read access to results
  - `student` role: Submit responses, view own results
  - Middleware enforces role checks before endpoint execution

**Row-Level Security (RLS)**:
- Database-level security policies on all tables
- Users can only access data they own or have been granted access to
- Example policies:
  ```sql
  -- Teachers can only see their own diagnostics
  CREATE POLICY teacher_own_diagnostics ON diagnostics
    FOR ALL USING (auth.uid() = creator_id);

  -- Students can access diagnostics via public link only
  CREATE POLICY student_access_published ON diagnostics
    FOR SELECT USING (published = true);
  ```

### Input Validation & Sanitization

**Frontend Validation**:
- **Zod Schemas**: Type-safe validation before API calls
- **React Hook Form**: Real-time form validation with error messages
- **File Upload Restrictions**:
  - Accepted types: PDF, DOCX only
  - Max file size: 10MB
  - MIME type verification (not just extension)

**Backend Validation**:
- **Pydantic Models**: Strict type checking and data validation
- **SQL Injection Prevention**:
  - Parameterized queries via Supabase client (no raw SQL)
  - ORM-level query building prevents injection
- **XSS Protection**:
  - HTML sanitization on all user-generated content
  - Content Security Policy (CSP) headers
  - Escaping in email templates (Jinja2 autoescaping)
- **CSRF Protection**:
  - SameSite cookies for session management
  - Double-submit cookie pattern for state-changing operations

### API Security

**CORS Configuration**:
- Whitelist of allowed origins (configurable via environment)
- Credentials allowed only from trusted domains
- Preflight request handling for complex requests

**Rate Limiting**:
- **Global Rate Limit**: 100 requests/minute per IP (public endpoints)
- **Authenticated Rate Limit**: 1000 requests/minute per user
- **AI Endpoint Limits**: 10 requests/minute for syllabus extraction (prevents abuse)
- **Exponential Backoff**: Automatic retry with increasing delays
- Implementation: SlowAPI library with Redis backend

**Request Size Limits**:
- JSON body max: 1MB
- File upload max: 10MB
- Request timeout: 30 seconds for standard endpoints, 2 minutes for AI processing

### Data Protection

**Encryption**:
- **In Transit**: TLS 1.3 for all API communication (HTTPS enforced)
- **At Rest**:
  - Supabase encrypts database with AES-256
  - File storage encrypted on Supabase Storage
  - Environment variables encrypted in deployment platforms
- **Sensitive Data Handling**:
  - API keys never logged or exposed in responses
  - Email addresses hashed for analytics (optional)
  - No PII stored in client-side localStorage

**Database Security**:
- **Connection Security**: SSL-encrypted connections to PostgreSQL
- **Least Privilege**: Service accounts have minimal required permissions
- **Audit Logging**: All data modifications logged with timestamps and user ID
- **Backup & Recovery**:
  - Daily automated backups (Supabase managed)
  - Point-in-time recovery available
  - Backup retention: 30 days

### Privacy & Compliance

**Data Collection**:
- **Minimal Data**: Only collect what's necessary (name, email, responses)
- **No Tracking**: No analytics or third-party tracking scripts
- **Student Privacy**:
  - FERPA-compliant (no sharing of student data)
  - Student emails only used for feedback, never stored permanently
  - Option to anonymize student data in analytics

**Data Retention**:
- Diagnostic assessments: Retained until deleted by teacher
- Student responses: 1-year retention, then auto-deleted
- Audit logs: 90-day retention

**User Rights**:
- **Data Export**: Teachers can export all diagnostic data (CSV/JSON)
- **Data Deletion**: Complete account deletion removes all associated data
- **Access Control**: Users can view what data is stored about them

### Security Best Practices

**Code Security**:
- **Dependency Scanning**: Automated vulnerability scanning (Dependabot)
- **Secret Management**:
  - Environment variables for all secrets
  - No hardcoded credentials in codebase
  - `.env` files excluded from version control
- **Error Handling**:
  - Generic error messages to users (no stack traces in production)
  - Detailed errors logged server-side for debugging
  - Sentry integration for error monitoring

**Infrastructure Security**:
- **Deployment Security**:
  - Immutable deployments (no direct server access)
  - Automatic HTTPS certificate management
  - DDoS protection via CDN
- **Environment Isolation**: Separate dev/staging/production environments
- **Access Control**:
  - 2FA required for deployment platforms
  - SSH keys for Git operations
  - Limited team access to production secrets

**Monitoring & Incident Response**:
- **Real-time Monitoring**: Uptime monitoring with alerting
- **Security Headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000`
  - `Content-Security-Policy: default-src 'self'`
- **Incident Response Plan**: Documented procedures for security breaches
- **Regular Security Audits**: Quarterly review of access logs and permissions

### Known Limitations & Future Improvements

**Current Limitations**:
- Email sent via SendGrid (third-party trust required)
- Student responses not end-to-end encrypted
- No multi-factor authentication (MFA) for students

**Planned Security Enhancements**:
- Implement MFA for teacher accounts
- Add honeypot fields to prevent bot submissions
- Implement anomaly detection for unusual usage patterns
- Add encrypted response storage for sensitive assessments

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Accounts: Supabase, Anthropic, SendGrid (or Gmail)

### Local Development

**1. Clone and Install**
```bash
git clone https://github.com/Hadeva-Dev/reTeach.git
cd reTeach

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

**2. Configure Environment**
```bash
# Copy example files
cp .env.example .env.local
cp backend/.env.example backend/.env

# Edit .env.local and backend/.env with your credentials
# See Environment Variables section below
```

**3. Start Development Servers**
```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Start frontend
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

### Frontend (`.env.local`)

Copy `.env.example` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# SendGrid (optional for frontend)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=your_email@domain.com

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Backend (`backend/.env`)

Copy `backend/.env.example` and fill in:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# SendGrid (recommended for production)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=your_email@domain.com

# Frontend URL (for generating shareable links)
FRONTEND_URL=http://localhost:3000

# CORS (add your frontend URL)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Application Settings
ENVIRONMENT=development
DEBUG=true
```

**Note**: For Gmail SMTP alternative (development only), see `backend/.env.example`

---

## Deployment

### Production Deployment

reTeach is designed with:
- **Frontend**: Vercel (Next.js optimized)
- **Backend**: Railway (Python friendly)


---

## Project Structure

```
reTeach/
├── src/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── lib/              # Utilities & API client
├── backend/               # FastAPI backend
│   └── app/
│       ├── routers/      # API endpoints
│       ├── services/     # Business logic
│       ├── models/       # Data models
│       └── utils/        # Helpers
├── public/               # Static assets
├── .env.example          # Frontend env template
├── backend/.env.example  # Backend env template
├── DEPLOYMENT.md        # Deployment guide
└── SECURITY_NOTICE.md   # Security checklist
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- Bug Reports: [GitHub Issues](https://github.com/Hadeva-Dev/reTeach/issues)
- Discussions: [GitHub Discussions](https://github.com/Hadeva-Dev/reTeach/discussions)

---

## About the Developers

**reTeach** was created by **Dennis Freyman** and **Hao Lin** for the **2025 Congressional App Challenge**.

We're high school students passionate about using technology to solve real problems in education. After speaking with teachers who struggled with the time-intensive process of creating diagnostic assessments and providing personalized feedback to students, we built reTeach to automate this workflow using AI.

Our goal is to give educators more time to focus on teaching while ensuring every student gets the personalized support they need to succeed.

---

<div align="center">
  <sub>Built by <a href="https://github.com/zarfix123">Dennis Freyman</a> & <a href="https://github.com/jappabl">Hao Lin</a></sub>
  <br>
  <sub><a href="https://www.linkedin.com/in/dennis-freyman/">Dennis on LinkedIn</a> • <a href="https://www.linkedin.com/in/haolinpacific/">Hao on LinkedIn</a></sub>
  <br><br>
  <sub>Created for the Congressional App Challenge 2025</sub>
</div>
