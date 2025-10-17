# 📚 reTeach

> **Intelligent Diagnostic Assessment Platform for Educators**

reTeach transforms your course syllabus into personalized diagnostic assessments in minutes. Using AI, it generates topic-specific questions, analyzes student performance, and automatically sends tailored study resources via email.

---

## ✨ Features

- 🤖 **AI-Powered Question Generation** - Automatically creates diagnostic questions from your syllabus
- 📊 **Real-Time Analytics** - Track student performance by topic with interactive dashboards
- 📧 **Automated Study Resources** - Students receive personalized Khan Academy links for weak topics
- 🎯 **Topic-Based Analysis** - Identify knowledge gaps across your entire course
- 🔗 **Easy Sharing** - Share assessments via link or QR code
- 📱 **Mobile Friendly** - Works seamlessly on any device

---

## 🚀 Quick Start

### For Teachers

1. **Upload Your Syllabus** → AI extracts course topics
2. **Review & Generate Questions** → AI creates 3 questions per topic
3. **Preview & Publish** → Share with students
4. **View Results** → Analyze performance and identify trends

### For Students

1. **Open Assessment Link** → Receive link from teacher
2. **Enter Your Name & Email** → Start the diagnostic
3. **Answer Questions** → Complete all questions
4. **Receive Resources** → Get personalized study materials via email

---

## 📖 Complete Workflow Guide

### Step 1: Upload Your Syllabus

Navigate to the **Create** page and upload your course syllabus (PDF or TXT file).

![Upload Syllabus](./docs/images/01-upload.png)
*The AI will automatically extract course topics and structure from your syllabus*

**What happens:**
- AI reads your syllabus
- Extracts main topics and subtopics
- Identifies prerequisites and course structure

---

### Step 2: Review Topics

After upload, review the extracted topics. You can add, remove, or edit any topics.

![Review Topics](./docs/images/02-review-topics.png)
*Review and customize the topics before generating questions*

**Actions available:**
- ✅ Select/deselect topics to include
- ✏️ Edit topic names
- ➕ Add new topics manually
- 🗑️ Remove irrelevant topics

---

### Step 3: Generate Questions

Click **Generate Questions** to create 3 AI-powered questions per topic.

![Generate Questions](./docs/images/03-generate.png)
*AI generates topic-specific multiple choice questions with 3 options each*

**Generation process:**
- Creates 3 questions per selected topic
- Each question has 3 answer choices
- Questions test different cognitive levels (Remember, Understand, Apply)
- Includes rationale for correct answers

---

### Step 4: Preview & Edit Questions

Review all generated questions. Click any question to edit the stem, options, or correct answer.

![Preview Questions](./docs/images/04-preview.png)
*Edit questions, options, and mark correct answers before publishing*

**Editing features:**
- 📝 Edit question text
- ✏️ Modify answer options
- ✓ Set correct answer by clicking the checkmark
- 👁️ Preview student view

---

### Step 5: Publish Form

Enter a form title and click **Publish Form** to create your diagnostic assessment.

![Publish Form](./docs/images/05-publish.png)
*Publishing creates a unique shareable link for your assessment*

**What you get:**
- 🔗 Unique form URL
- 📱 QR code for easy sharing
- 📊 Results dashboard link

---

### Step 6: Share with Students

Share the form link or QR code with your students via email, LMS, or classroom display.

![Share Form](./docs/images/06-share.png)
*Multiple ways to share your diagnostic with students*

**Sharing options:**
- Copy link to clipboard
- Download QR code
- Share via email
- Post in LMS (Canvas, Blackboard, etc.)

---

### Step 7: Student Experience

Students receive a clean, simple interface to complete the diagnostic.

![Student Form](./docs/images/07-student-form.png)
*Students enter their name/email and answer questions one by one*

**Student workflow:**
1. Enter name and email
2. Answer all questions (one per page)
3. Submit assessment
4. Receive confirmation with score

---

### Step 8: Automated Email to Students

After submission, students automatically receive an email with:
- Their overall score
- Khan Academy resources for weak topics
- Textbook page references
- Next steps for improvement

![Student Email](./docs/images/08-student-email.png)
*Personalized study resources sent automatically after submission*

**Email includes:**
- 📊 Score breakdown
- 📚 Khan Academy links for each weak topic
- 📖 Textbook page ranges
- 💡 Study recommendations

---

### Step 9: View Results Dashboard

Access the results dashboard to see aggregated performance data.

![Results Dashboard](./docs/images/09-results.png)
*Interactive dashboard showing performance by topic*

**Analytics shown:**
- 📊 Average score across all students
- 📈 Topic-by-topic performance
- 👥 Total number of responses
- 🎯 Weak topics identification
- 📉 Score distribution

**Key metrics:**
- **Total Responses** - Number of students who completed the assessment
- **Average Score** - Overall class performance
- **Topic Scores** - Bar chart showing average score per topic
- **Weak Topics** - Topics where students struggled most

---

### Step 10: Dashboard Overview

View all your diagnostics and track overall class readiness.

![Dashboard](./docs/images/10-dashboard.png)
*Manage all your diagnostic assessments in one place*

**Dashboard features:**
- 📋 All published diagnostics
- 🎯 Overall readiness score
- 📊 Response rates
- 🔴 At-risk students
- 📅 Recent activity

---

## 🎨 Key Features in Detail

### AI Question Generation

reTeach uses Claude AI (Anthropic) to generate high-quality diagnostic questions:

- **Context-Aware** - Questions match your course content and level
- **Varied Difficulty** - Includes easy, medium, and hard questions
- **Bloom's Taxonomy** - Tests different cognitive levels
- **Topic-Specific** - Each question targets a specific topic

### Real-Time Analytics

Track student performance with interactive visualizations:

- **Topic Distribution** - See which topics students struggle with
- **Score Trends** - Monitor class performance over time
- **Individual Results** - Drill down to specific student responses
- **Export Data** - Download results for further analysis

### Automated Study Resources

Students receive personalized resources based on their weak topics:

- **Khan Academy Links** - Curated video lessons and practice
- **Textbook References** - Page ranges for each topic
- **Study Recommendations** - Prioritized learning paths
- **Email Delivery** - Sent automatically after submission

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Interactive data visualizations
- **Framer Motion** - Smooth animations

### Backend
- **FastAPI** (Python) - High-performance API
- **Supabase** - PostgreSQL database
- **Anthropic Claude** - AI question generation
- **SMTP** - Email delivery

### Deployment
- **Vercel** - Frontend hosting
- **Railway/Render** - Backend hosting

---

## 📦 Installation & Setup

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.10+ (for backend)
- **Supabase** account (free tier works)
- **Anthropic API** key (for AI features)
- **SMTP** credentials (Gmail, SendGrid, etc.)

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/Hadeva-Dev/reTeach.git
cd reTeach

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URLs

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials:
# - SUPABASE_URL
# - SUPABASE_KEY
# - ANTHROPIC_API_KEY
# - SMTP credentials

# Run development server
uvicorn app.main:app --reload --port 8000
```

Backend runs at [http://localhost:8000](http://localhost:8000)

---

## 🔑 Environment Variables

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend API URL
```

### Backend (.env)

```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# AI
ANTHROPIC_API_KEY=your_anthropic_api_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
BOT_EMAIL=your_email@gmail.com
BOT_PASSWORD=your_app_password
```

---

## 🚀 Deployment

### Deploy Frontend to Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Configure settings:
   - **Framework**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your backend URL
5. Deploy!

### Deploy Backend to Railway

1. Create new project in Railway
2. Connect GitHub repository
3. Select `backend` directory as root
4. Add environment variables (Supabase, Anthropic, SMTP)
5. Deploy!

**Alternative:** Use Render.com or Fly.io for backend hosting.

---

## 📝 Usage Tips

### For Teachers

- **Start Small** - Begin with 5-10 topics for your first diagnostic
- **Review Questions** - Always preview and edit AI-generated questions
- **Share Early** - Give students at least 24 hours to complete
- **Monitor Results** - Check the dashboard regularly during the assessment window
- **Follow Up** - Use weak topics data to adjust your teaching

### For Students

- **Complete in One Sitting** - Most diagnostics take 10-20 minutes
- **Use Valid Email** - You'll receive study resources via email
- **Read Carefully** - Each question tests a specific concept
- **Check Your Email** - Personalized resources arrive immediately after submission

---

## 🔒 Security & Privacy

- **No Account Required** - Students don't need to create accounts
- **Email Privacy** - Student emails are only used for sending resources
- **Secure Storage** - All data encrypted in transit and at rest
- **FERPA Compliant** - No personal information shared with third parties

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Anthropic Claude** - AI question generation
- **Khan Academy** - Educational resource links
- **Supabase** - Database and authentication
- **Vercel** - Frontend hosting
- **Next.js Team** - Amazing framework

---

## 📧 Support

- 📖 **Documentation**: [GitHub Wiki](https://github.com/Hadeva-Dev/reTeach/wiki)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Hadeva-Dev/reTeach/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Hadeva-Dev/reTeach/discussions)

---

## 🗺️ Roadmap

### Coming Soon

- [ ] PDF export of results
- [ ] Custom branding options
- [ ] Multi-language support
- [ ] Video tutorial integration
- [ ] Bulk student import
- [ ] Advanced analytics (percentiles, trends)
- [ ] Integration with LMS (Canvas, Blackboard)
- [ ] Mobile app (iOS & Android)

---

<div align="center">

**Made with ❤️ for educators**

[Get Started](https://reteach.app) • [Documentation](https://github.com/Hadeva-Dev/reTeach/wiki) • [Report Bug](https://github.com/Hadeva-Dev/reTeach/issues)

</div>
