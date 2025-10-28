# University Integration Roadmap

This document outlines security, compliance, and technical requirements for integrating reTeach with university systems.

## Current Security Status

### ✅ Already Implemented
- **SQL Injection Protection**: Supabase parameterized queries
- **XSS Protection**: HTML escaping on all user inputs
- **Email Validation**: Pydantic EmailStr validation
- **Input Length Limits**: Max lengths on all text fields (255 chars for names, 100 for questions)
- **Type Validation**: Pydantic models enforce strict types
- **CORS Configuration**: Configured for production domains
- **Data Encryption**: At rest and in transit via Supabase
- **Teacher-Student Linking**: Automatic assignment when students submit forms
- **Duplicate Prevention**: Unique constraints on teacher-student relationships

### ⚠️ Required Before University Pilots

## 1. FERPA Compliance (Student Privacy)

**What is FERPA?**
Federal law protecting student education records. Required for all K-12 and higher education institutions.

**Required Features:**

### A. Access Controls
- [ ] **Role-Based Access Control (RBAC)**
  - Teachers can only see their own students
  - Students can only see their own data
  - Admin role for school administrators
  - Implement middleware to check user permissions on every request

- [ ] **Audit Logging**
  - Log all access to student data (who, when, what)
  - Store logs for minimum 3 years
  - Create `audit_logs` table:
    ```sql
    CREATE TABLE audit_logs (
      id uuid PRIMARY KEY,
      user_id uuid,
      user_email varchar,
      action varchar,
      resource_type varchar,
      resource_id uuid,
      timestamp timestamptz,
      ip_address varchar,
      user_agent text
    )
    ```

### B. Data Rights
- [ ] **Student Data Export** (`GET /api/students/{id}/export`)
  - Export all student data in JSON/CSV format
  - Include: responses, sessions, scores, assignments
  - Required by FERPA for parent/student requests

- [ ] **Student Data Deletion** (`DELETE /api/students/{id}`)
  - Hard delete student and all associated data
  - Cascade delete: sessions, responses, teacher_students links
  - Required for "right to be forgotten"

### C. Parental Consent
- [ ] Add `parental_consent` boolean to students table
- [ ] Require consent for students under 18
- [ ] Create consent form/workflow

## 2. Authentication & Authorization

### Current: Google OAuth
**Status**: ✅ **GOOD ENOUGH FOR INITIAL PILOTS** (1-5 classes, individual professors)

### For Small Pilots (Start Here - No SSO Needed!)
You can run university pilots for 6-12 months with just:
- [x] Google OAuth (already implemented)
- [ ] Optional: .edu email verification for pilot universities
  ```python
  # Only enable if university requests it
  @field_validator('email')
  @classmethod
  def verify_edu_email(cls, v: str) -> str:
      allowed_domains = ['stanford.edu', 'berkeley.edu']  # Add pilot schools
      if not any(v.endswith(domain) for domain in allowed_domains):
          raise ValueError('Must use university email')
      return v
  ```

**Why this works for pilots:**
- Professors often run informal tools with just Google login
- Students already use Google for everything
- No IT department approval needed for small pilots
- Faster to get started

### For Full University Deployment (ONLY IF IT department requires)

**When you need this**: University wants 20+ classes, official vendor contract, or IT security team gets involved (usually 1-2 years after first pilots)

- [ ] **SAML/SSO Support**
  - Integrate with university identity providers (Shibboleth, Azure AD, Okta)
  - Students/teachers login via their .edu accounts
  - Libraries to use: `python3-saml`, `pysaml2`
  - **Cost**: 4-6 weeks of dev time OR $200-500/month for Auth0/WorkOS to handle it

- [ ] **LTI Integration (Learning Tools Interoperability)**
  - Standard for integrating with Canvas, Blackboard, Moodle
  - Teachers launch reTeach directly from their LMS
  - Auto-creates accounts and syncs rosters
  - Library: `pylti1p3`
  - **Cost**: 3-4 weeks of dev time

## 3. Rate Limiting & API Security

### Why Universities Require This:
- Prevent abuse/DoS attacks on shared infrastructure
- Required in most vendor security questionnaires
- Protects against credential stuffing attacks

### Implementation:

- [ ] **Install Rate Limiting**
  ```bash
  pip install slowapi
  ```

- [ ] **Add to main.py:**
  ```python
  from slowapi import Limiter, _rate_limit_exceeded_handler
  from slowapi.util import get_remote_address
  from slowapi.errors import RateLimitExceeded

  limiter = Limiter(key_func=get_remote_address)
  app.state.limiter = limiter
  app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
  ```

- [ ] **Apply Limits to Endpoints:**
  ```python
  @router.post("/submit")
  @limiter.limit("10/minute")  # 10 submissions per minute per IP
  async def submit_form(...):
  ```

- [ ] **Suggested Rate Limits:**
  - Form submissions: 10/minute per IP
  - Form creation: 20/hour per teacher
  - API reads: 100/minute per user
  - Login attempts: 5/minute per IP

## 4. Request Size Limits

- [ ] **Add to main.py:**
  ```python
  from fastapi.middleware import Middleware
  from starlette.middleware.base import BaseHTTPMiddleware

  app = FastAPI(
      ...
      middleware=[
          Middleware(
              BaseHTTPMiddleware,
              max_request_size=10_000_000  # 10MB max
          )
      ]
  )
  ```

## 5. Data Residency & Compliance

### Questions Universities Will Ask:

- [ ] **Where is data stored?**
  - Answer: Supabase (specify region, e.g., US East)
  - Some universities require data stored in specific countries/states

- [ ] **Is data encrypted?**
  - ✅ Yes - at rest and in transit (SSL/TLS)
  - Document encryption standards used

- [ ] **Who has access to the database?**
  - List all team members with production access
  - Implement principle of least privilege

- [ ] **Data retention policy**
  - How long do you keep student data?
  - Typical: 1-3 years after course ends
  - Create retention policy document

- [ ] **Backup & disaster recovery**
  - How often are backups taken?
  - What's the recovery time objective (RTO)?
  - Document Supabase backup policies

## 6. Security Questionnaire Prep

Universities will send security questionnaires. Be ready to answer:

### Technical Security
- [x] SQL injection prevention
- [x] XSS protection
- [ ] Rate limiting
- [x] HTTPS/TLS encryption
- [ ] Authentication method (SSO/SAML)
- [ ] Authorization/access controls
- [ ] Audit logging
- [ ] Vulnerability scanning (add to CI/CD)
- [ ] Penetration testing (hire firm before university pilots)

### Compliance
- [ ] FERPA compliance documentation
- [ ] Privacy policy (already created at /privacy)
- [ ] Terms of service (already created at /terms)
- [ ] Data processing agreement (DPA) template
- [ ] Incident response plan
- [ ] Security training for team members

### Business
- [ ] Liability insurance (E&O, cyber insurance)
- [ ] SLA (service level agreement) - uptime guarantees
- [ ] Support channels (email, phone, ticket system)
- [ ] Escalation procedures

## 7. University Pilot Checklist

Before reaching out to universities:

### Must-Have (Blockers)
- [ ] SAML/SSO integration OR .edu email verification
- [ ] FERPA-compliant privacy policy
- [ ] Data export endpoint
- [ ] Data deletion endpoint
- [ ] Audit logging
- [ ] Role-based access control
- [ ] Rate limiting

### Should-Have (Competitive)
- [ ] LTI integration (Canvas/Blackboard)
- [ ] Roster sync (auto-import students from LMS)
- [ ] Grade passback to LMS
- [ ] Analytics dashboard for department heads
- [ ] Multi-tenant support (separate data per university)

### Nice-to-Have
- [ ] White-label branding per university
- [ ] Custom domain per university
- [ ] Advanced analytics/reporting
- [ ] Integration with SIS (Student Information Systems)

## 8. Development Priorities

**Phase 1: Compliance Basics (2-3 weeks)**
1. Add audit logging
2. Implement RBAC middleware
3. Add data export/deletion endpoints
4. Add rate limiting
5. Update privacy policy for FERPA

**Phase 2: Authentication (2-4 weeks)**
1. Research university SSO systems
2. Implement SAML integration
3. Add .edu email verification
4. Test with sample university

**Phase 3: LMS Integration (3-6 weeks)**
1. Implement LTI 1.3
2. Test with Canvas sandbox
3. Add roster sync
4. Add grade passback

**Phase 4: Enterprise Features (ongoing)**
1. Multi-tenant architecture
2. Advanced analytics
3. SIS integrations
4. Penetration testing

## 9. Recommended Service Providers

### Security & Compliance
- **Vanta** or **Drata**: SOC 2 compliance automation ($3-5k/year)
- **1Password Teams**: Credential management for team
- **Cloudflare**: DDoS protection, WAF, rate limiting

### Authentication
- **Auth0** or **Okta**: Handles SAML/SSO for you ($200-500/month)
- **WorkOS**: Purpose-built for B2B SaaS SSO ($99/month)

### Monitoring & Logging
- **Sentry**: Error tracking
- **Datadog** or **LogRocket**: Application monitoring
- **Better Stack**: Log aggregation

### Legal
- **Termly** or **Iubenda**: Auto-generate FERPA-compliant privacy policies
- **Ironclad** or **PandaDoc**: Contract management for university agreements

## 10. Typical University Procurement Timeline

1. **Initial Contact**: Reach out to ed-tech office or department chair
2. **Demo (Week 1-2)**: Show product to stakeholders
3. **Pilot Proposal (Week 3-4)**: Write proposal with 1-2 courses
4. **Security Review (Week 5-8)**: IT security team reviews your system
5. **Legal Review (Week 9-12)**: Contracts, DPA, terms negotiation
6. **Pilot Approval (Week 13-16)**: Final sign-off
7. **Pilot Launch (Week 17+)**: Start with 1-2 classes

**Total timeline: 4-6 months** from first contact to pilot launch

**Tip**: Start with smaller universities or community colleges - faster approval process

## 11. Key Contacts at Universities

Who to reach out to:
- **Director of Educational Technology**
- **Center for Teaching & Learning**
- **Department Chairs** (Math, Science, Education)
- **Faculty Innovation Grants** (many universities have these)
- **Instructional Designers**

## 12. Questions to Ask Universities

Before building features, ask:
1. What LMS do you use? (Canvas, Blackboard, Moodle, D2L)
2. What SSO system? (Shibboleth, Azure AD, Okta, Google Workspace)
3. What's your typical pilot process?
4. What security certifications do you require? (SOC 2, ISO 27001)
5. Do you need on-premise hosting? (some do, most accept cloud now)
6. What's your budget for ed-tech tools per student?

## Resources

### FERPA
- [FERPA Official Guide](https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html)
- [FERPA for Ed-Tech Startups](https://privacy.commonsense.org/evaluation/ferpa)

### LTI Integration
- [IMS Global LTI 1.3 Spec](https://www.imsglobal.org/spec/lti/v1p3/)
- [Canvas LTI Developer Guide](https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html)

### Security Standards
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls)

### EdTech Resources
- [EdSurge](https://www.edsurge.com/) - Ed-tech news and funding
- [ASU+GSV Summit](https://www.asugsvsummit.com/) - Major ed-tech conference
- [IMS Global](https://www.imsglobal.org/) - Ed-tech standards organization

---

## Quick Start: Minimal Viable University Pilot

If you need to move fast, this is the absolute minimum:

1. ✅ Add rate limiting (2 hours)
2. ✅ Add audit logging (1 day)
3. ✅ Add data export endpoint (4 hours)
4. ✅ Require .edu emails for university pilots (2 hours)
5. ✅ Update privacy policy for FERPA (2 hours)
6. ✅ Add RBAC middleware (1 day)

**Total: 3-4 days of focused work**

Then you can approach universities for small pilots (1-2 classes) while building out full SSO/LTI integration.

---

**Last Updated**: January 2025
**Owner**: reTeach Team
**Status**: Pre-University Integration
