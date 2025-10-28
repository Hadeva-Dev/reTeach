# 🚀 Deployment Guide - reTeach
<div align="center">
  <a href="https://moonshot.hackclub.com" target="_blank">
    <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/35ad2be8c916670f3e1ac63c1df04d76a4b337d1_moonshot.png" 
         alt="This project is part of Moonshot, a 4-day hackathon in Florida visiting Kennedy Space Center and Universal Studios!" 
         style="width: 100%;">
  </a>
</div>


## Overview

reTeach uses a split deployment architecture:
- **Frontend**: Next.js on Vercel
- **Backend**: FastAPI on Railway

## Prerequisites

1. Accounts set up on:
   - [Vercel](https://vercel.com)
   - [Railway](https://railway.app)
   - [Supabase](https://supabase.com)
   - [Anthropic](https://console.anthropic.com)
   - [SendGrid](https://sendgrid.com) (recommended) or Gmail SMTP

2. All credentials rotated (see [SECURITY_NOTICE.md](./SECURITY_NOTICE.md))

---

## Step 1: Set Up Supabase Database

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project (use your production project)
3. Run the database schema (if you have migration files, run them)
4. Get your credentials:
   - Go to Settings → API
   - Copy `URL` (SUPABASE_URL)
   - Copy `anon public` key (SUPABASE_KEY)
   - Copy `service_role` key (keep secret!)
   - Go to Settings → Database
   - Copy `Connection string` → Transaction → Update password → Copy URL

---

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your reTeach repository
5. Railway will auto-detect it's a Python app

### 2.2 Configure Build Settings

1. In Railway dashboard, go to your service
2. Settings → Build:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 2.3 Set Environment Variables

In Railway → Your Service → Variables tab, add:

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_anon_key_here

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Application
ENVIRONMENT=production
DEBUG=false
CACHE_ENABLED=true

# Frontend URL (update after deploying to Vercel)
FRONTEND_URL=https://your-app.vercel.app

# CORS Origins (update after deploying to Vercel)
CORS_ORIGINS=https://your-app.vercel.app,https://www.your-app.vercel.app

# Email Configuration - SendGrid (RECOMMENDED for production)
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@yourdomain.com

# OR Gmail SMTP (may be blocked by Railway)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# BOT_EMAIL=your_email@gmail.com
# BOT_PASSWORD=your_app_password
```

### 2.4 Get Your Backend URL

1. After deployment, Railway will give you a URL like: `https://reteach-backend-production.up.railway.app`
2. Copy this URL - you'll need it for frontend deployment

### 2.5 Configure Health Checks

1. Go to Settings → Health Check
2. Set path to: `/health`
3. This ensures Railway monitors your backend

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your reTeach GitHub repository
4. Vercel will auto-detect it's a Next.js app

### 3.2 Configure Build Settings

- **Framework Preset**: Next.js
- **Root Directory**: `.` (leave as root)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

### 3.3 Set Environment Variables

In Vercel → Project Settings → Environment Variables, add:

```bash
# Supabase (Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Backend API (use Railway URL from Step 2.4)
BACKEND_URL=https://your-backend.railway.app
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app

# SendGrid (if using email from frontend)
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@yourdomain.com

# Google OAuth (if using)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=xxx

# Optional: Teacher filtering
NEXT_PUBLIC_TEACHER_EMAIL=teacher@example.com
NEXT_PUBLIC_TEACHER_NAME=Teacher Name

# Production environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3.4 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Vercel will give you URLs like:
   - Production: `https://reteach.vercel.app`
   - Preview: `https://reteach-git-main-youruser.vercel.app`

---

## Step 4: Update Cross-References

Now that both are deployed, update environment variables:

### 4.1 Update Railway Backend

Go back to Railway → Variables and update:
```bash
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app,https://www.your-app.vercel.app
```

### 4.2 Trigger Redeploy

Railway → your service → click "Redeploy" to apply the new CORS settings

---

## Step 5: Verify Deployment

### 5.1 Test Backend Health

Visit: `https://your-backend.railway.app/health`

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
```

### 5.2 Test Backend Docs

Visit: `https://your-backend.railway.app/docs`

Should show FastAPI Swagger UI

### 5.3 Test Frontend

1. Visit: `https://your-app.vercel.app`
2. Try uploading a syllabus
3. Generate questions
4. Publish a form
5. Test form submission as a student
6. Check if email arrives (this validates SendGrid)

---

## Step 6: Custom Domain (Optional)

### For Frontend (Vercel)

1. Vercel → Project Settings → Domains
2. Add your domain (e.g., `reteach.app`)
3. Update DNS records as shown
4. Wait for SSL certificate (automatic)

### For Backend (Railway)

1. Railway → Settings → Domains
2. Add custom domain (e.g., `api.reteach.app`)
3. Update DNS with CNAME record
4. Update `FRONTEND_URL` and `CORS_ORIGINS` in Railway
5. Update `NEXT_PUBLIC_BACKEND_URL` in Vercel
6. Redeploy both services

---

## Troubleshooting

### Backend Issues

**"Database connection failed"**
- Check SUPABASE_URL and SUPABASE_KEY are correct
- Verify Supabase project is active
- Check Railway logs: `railway logs`

**"Email sending failed"**
- Verify SendGrid API key is valid
- Check FROM_EMAIL is verified in SendGrid
- Check Railway logs for specific error

**CORS errors**
- Ensure CORS_ORIGINS includes your Vercel URL
- Include both www and non-www versions
- Must include `https://` prefix

### Frontend Issues

**"Failed to fetch"**
- Check NEXT_PUBLIC_BACKEND_URL is correct
- Test backend health endpoint directly
- Check browser console for specific error

**"Not authorized"**
- Check Supabase keys are correct
- Verify SUPABASE_SERVICE_ROLE_KEY is set (for server actions)

**Build fails**
- Check all required env vars are set in Vercel
- Look for TypeScript errors in build logs
- May need to set `ignoreBuildErrors: true` temporarily

---

## Monitoring & Maintenance

### Railway Monitoring

- Monitor CPU/Memory usage in Railway dashboard
- Set up usage alerts
- Check logs regularly: Settings → Observability

### Vercel Monitoring

- View analytics in Vercel dashboard
- Monitor Web Vitals
- Check function logs for errors

### Database Monitoring

- Monitor Supabase dashboard for:
  - Database size
  - Active connections
  - Query performance
  - API requests

---

## Cost Estimates

### Free Tier Limits

- **Railway**: $5 free credit/month (should be enough for early usage)
- **Vercel**: 100GB bandwidth, unlimited serverless functions
- **Supabase**: 500MB database, 2GB bandwidth
- **SendGrid**: 100 emails/day free
- **Anthropic**: Pay per use (~$3 per million tokens)

### When to Upgrade

- Railway: When backend exceeds $5/month usage
- Vercel: When you exceed 100GB bandwidth (unlikely early on)
- Supabase: When database exceeds 500MB
- SendGrid: When sending >100 emails/day

---

## Security Checklist

- [ ] All credentials rotated from SECURITY_NOTICE.md
- [ ] Environment variables set in Vercel (not in code)
- [ ] Environment variables set in Railway (not in code)
- [ ] `.env` files in `.gitignore`
- [ ] CORS properly configured (only your domains)
- [ ] Supabase Row Level Security enabled (check policies)
- [ ] HTTPS enforced (automatic on Vercel/Railway)
- [ ] SendGrid sender verified
- [ ] No credentials in git history (run BFG if needed)

---

## Support

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Check Vercel function logs
3. Check Supabase logs
4. Review this guide's troubleshooting section
5. Check GitHub issues

---

**Last Updated**: 2025-10-20
**For**: reTeach v0.1.0
