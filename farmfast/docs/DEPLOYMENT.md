# Deployment Guide

## Deploy to Vercel (Recommended)

### Step 1: Prepare Your Code

```bash
# Make sure everything is committed
git add .
git commit -m "Ready for deployment"
git push
```

### Step 2: Deploy via Vercel Website

1. Go to https://vercel.com
2. Sign up/Login (use GitHub for easy integration)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure project:
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`

### Step 3: Add Environment Variables

Add these 6 variables in Vercel:

```
GEMINI_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_NUMBER
```

Copy values from your `.env.local` file.

### Step 4: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes
3. Get your URL: `https://your-project.vercel.app`

### Step 5: Configure Twilio

1. Go to: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox
2. Set webhook: `https://your-vercel-url.vercel.app/api/whatsapp`
3. Method: POST
4. Save

### Step 6: Test

1. Join WhatsApp sandbox (send "join habit-needed" to +1 415 523 8886)
2. Send a photo
3. Follow the prompts
4. Check your dashboard!

---

## Alternative: Deploy with ngrok (Local Testing)

### Step 1: Install ngrok

Download from: https://ngrok.com/download

### Step 2: Start Your App

```bash
npm run dev
```

### Step 3: Start ngrok

```bash
ngrok http 3000
```

Copy the HTTPS URL.

### Step 4: Configure Twilio

Set webhook to: `https://your-ngrok-url.ngrok-free.app/api/whatsapp`

### Step 5: Test

Send photo to WhatsApp and test the flow!

---

## Updating Your Deployment

### If using Vercel + GitHub:

```bash
git add .
git commit -m "Updated feature"
git push
```

Vercel auto-deploys in 1-2 minutes!

### If using Vercel without GitHub:

1. Go to Vercel dashboard
2. Click your project
3. Click "..." → "Redeploy"

---

## Troubleshooting

### Build Failed
- Check all environment variables are added
- Check build logs in Vercel dashboard
- Verify no TypeScript errors locally

### WhatsApp Not Working
- Verify webhook URL is correct
- Check if you joined the sandbox
- Check Vercel function logs

### Environment Variables Not Working
- Make sure they're in "Production" environment
- Redeploy after adding variables
