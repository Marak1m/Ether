# FarmFast - Quick Start Guide

Get FarmFast running in 5 minutes!

---

## 🎯 What You Need

- Node.js 18+ installed
- GitHub account
- Vercel account (free)
- Supabase account (free)
- Twilio account (free)
- Google Gemini API key (free)

---

## ⚡ Quick Setup (Local)

### 1. Install Dependencies

```bash
cd farmfast
npm install
```

### 2. Set Up Environment Variables

Create `farmfast/.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### 3. Set Up Database

Go to Supabase SQL Editor and run these files in order:

1. `farmfast/supabase-schema.sql`
2. `farmfast/update-schema-location.sql`
3. `farmfast/add-ratings-schema.sql`
4. `farmfast/insert-test-data.sql` (optional - adds test listings)

### 4. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

---

## 🚀 Deploy to Production

### 1. Push to GitHub

```bash
cd farmfast
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/farmfast.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to https://vercel.com
2. Click "Import Project"
3. Select your GitHub repo
4. Add environment variables (same as `.env.local`)
5. Click "Deploy"

### 3. Configure Twilio

1. Get your Vercel URL: `https://your-project.vercel.app`
2. Go to Twilio WhatsApp Sandbox
3. Set webhook: `https://your-project.vercel.app/api/whatsapp`
4. Save

### 4. Test WhatsApp

1. Add contact: +1 415 523 8886
2. Send join code from Twilio
3. Send a photo
4. Done! 🎉

---

## 📚 Documentation

- **README.md** - Complete documentation
- **PROJECT-STATUS.md** - Current project status
- **GIT-SETUP.md** - Detailed Git setup guide
- **docs/DEPLOYMENT.md** - Deployment guide
- **docs/WHATSAPP-FLOW.md** - WhatsApp flow
- **docs/API.md** - API documentation

---

## 🧪 Test Locally

### Test Dashboard
```bash
npm run dev
```

Visit:
- http://localhost:3000/landing - Landing page
- http://localhost:3000/dashboard - Dashboard
- http://localhost:3000/analytics - Analytics
- http://localhost:3000/admin - Create test listing

### Test Gemini AI
```bash
npx ts-node test-gemini.ts
```

---

## 🔑 Get API Keys

### Gemini AI
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### Supabase
1. Go to https://supabase.com/dashboard
2. Create new project
3. Go to Settings → API
4. Copy URL and anon key

### Twilio
1. Go to https://console.twilio.com
2. Get Account SID and Auth Token
3. Go to WhatsApp Sandbox
4. Get WhatsApp number: +1 415 523 8886

---

## ✅ Checklist

### Local Setup
- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created with all variables
- [ ] Database schema created in Supabase
- [ ] App runs locally (`npm run dev`)

### Deployment
- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Environment variables added in Vercel
- [ ] Twilio webhook configured
- [ ] WhatsApp tested end-to-end

---

## 🐛 Troubleshooting

### Dashboard not loading
```bash
# Check if dev server is running
npm run dev

# Check browser console for errors
```

### Build fails
```bash
# Test build locally
npm run build

# Check for TypeScript errors
```

### WhatsApp not working
- Verify webhook URL is correct
- Check if you joined the sandbox
- Check Vercel function logs

---

## 📞 Need Help?

Check these files:
1. `README.md` - Main documentation
2. `docs/DEPLOYMENT.md` - Deployment issues
3. `docs/WHATSAPP-FLOW.md` - WhatsApp issues
4. `PROJECT-STATUS.md` - Project overview

---

## 🎉 You're Ready!

FarmFast is ready to go. Follow the steps above and you'll be live in minutes!

**Questions?** Check the documentation files listed above.

**Ready to deploy?** See `GIT-SETUP.md` for detailed Git instructions.

---

**Built with ❤️ for Indian farmers**
