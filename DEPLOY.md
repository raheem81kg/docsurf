Deployment
Deploy to Vercel
Step-by-step guide to deploy intern3.chat on Vercel

Prerequisites
Vercel account
GitHub repository with your code
Convex account (for backend services)
PostgreSQL database (Neon, Supabase, or similar) (DATABASE_URL in environment variables)
Step 1: Set up Convex Backend
First, deploy your Convex backend:

# Install Convex CLI

bun install -g convex

# Login to Convex

bunx convex login

# Deploy to production

bunx convex deploy
Copy your production Convex URL from the deployment output.

Step 2: Database Setup
Ensure the DATABASE_URL environment variable is set in your local environment.

Run Migrations

# Set your database URL

export DATABASE_URL="postgresql://..."

# Generate and run migrations

bun auth:migrate
Step 3: Configure Environment Variables
In your Vercel project settings, add these environment variables:

Required Variables

# Database

DATABASE_URL=postgresql://your-db-url

# Better Auth

BETTER_AUTH_SECRET=your-secret-key

# Generate with: openssl rand -base64 32

# Convex

VITE_CONVEX_URL=https://your-convex-deployment.convex.cloud
VITE_CONVEX_API_URL=https://your-convex-deployment.convex.site

# Better Auth URL (set after deployment)

VITE_BETTER_AUTH_URL=https://your-app.vercel.app

# For encryption (BYOK feature)

ENCRYPTION_KEY=your-32-character-hex-string

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Email Configuration

# Email provider

EMAIL_PROVIDER=<resend|ses>
EMAIL_FROM=noreply@yourdomain.com

# Resend API key (if using Resend)

RESEND*API_KEY=re*...

# SES API key (if using SES)

AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=your-region
PostHog Analytics

VITE*POSTHOG_KEY=phc*...
VITE_POSTHOG_HOST=https://eu.i.posthog.com
OAuth Providers
These are used in Better Auth. You can add and remove providers as you like.

# Google OAuth

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Twitch OAuth

TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret
Step 4: Deploy to Vercel
The easiest way to deploy is to use the Vercel CLI, since you already have a clone locally to deploy to convex.

# Deploy

bunx vercel --prod

# Set production environment variables (either here or in the Vercel dashboard)

vercel env add DATABASE_URL
vercel env add BETTER_AUTH_SECRET

# ... add all other variables

Step 5: Configure Domain & Auth
Set Custom Domain (optional):

Go to Project Settings > Domains
Add your custom domain
Update Auth URLs:

Update VITE_BETTER_AUTH_URL with your final domain
Update OAuth redirect URIs in provider settings
Step 6: Convex Environment Variables
Now in your Convex Dashboard, go to the deployment > Settings, and add the following variables:

VITE_BETTER_AUTH_URL=<inherit>
ENCRYPTION_KEY=<inherit>

# Default API keys (when users don't provide their own)

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
FAL_API_KEY=fal-...
GROQ_API_KEY=gsk-...
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_TOKEN=your-r2-token

# Web search providers

FIRECRAWL_API_KEY=fc-...
BRAVE_API_KEY=BSA...

# R2/S3 bucket configuration for attachments and generated images

R2_BUCKET=your-bucket-name
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com # or relevant s3 endpoint
R2_TOKEN=your-r2-token

# If using r2, set to true, if using AWS s3, set to false

R2_FORCE_PATH_STYLE=true
