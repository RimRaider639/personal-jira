# Deployment Guide - Personal Kanban Board

This guide covers deploying the Personal Kanban Board application to free-tier services.

## Architecture Overview

| Component | Service | Free Tier Limits |
|-----------|---------|------------------|
| Backend API | Render | 750 hours/month, auto-sleep after 15min |
| Frontend | Vercel | 100GB bandwidth, unlimited sites |
| Database | MongoDB Atlas M0 | 512MB storage, shared cluster |
| File Storage | Cloudinary | 25GB storage, 25GB bandwidth/month |

## Prerequisites

1. GitHub account (for deployment integration)
2. MongoDB Atlas account
3. Cloudinary account
4. Render account
5. Vercel account

---

## Step 1: Set Up MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new project: "Personal Kanban"
4. Create a cluster:
   - Select **M0 Sandbox** (Free tier)
   - Choose a cloud provider and region close to your users
   - Name: `kanban-cluster`
5. Set up database access:
   - Go to **Database Access** → **Add New Database User**
   - Create a user with read/write access
   - Save the username and password
6. Set up network access:
   - Go to **Network Access** → **Add IP Address**
   - Select **Allow Access from Anywhere** (0.0.0.0/0) for Render
7. Get connection string:
   - Go to **Clusters** → **Connect** → **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `kanban`

Example connection string:
```
mongodb+srv://username:password@kanban-cluster.xxxxx.mongodb.net/kanban?retryWrites=true&w=majority
```

---

## Step 2: Set Up Cloudinary (Free Tier)

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account or sign in
3. Go to **Dashboard** to find your credentials:
   - Cloud Name
   - API Key
   - API Secret
4. (Optional) Create an upload preset:
   - Go to **Settings** → **Upload**
   - Add upload preset for allowed file types

---

## Step 3: Deploy Backend to Render

### Option A: Using Render Blueprint (Recommended)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click **New** → **Blueprint**
4. Connect your GitHub repository
5. Render will detect `render.yaml` and create the service
6. Set environment variables in the Render dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
   - `CORS_ORIGIN`: Your Vercel frontend URL (set after deploying frontend)

### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `kanban-api`
   - **Region**: Oregon (free tier)
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: Node
   - **Build Command**: `npm ci && npm run build -w @kanban/backend`
   - **Start Command**: `npm run start -w @kanban/backend`
   - **Plan**: Free
5. Add environment variables (same as Option A)
6. Click **Create Web Service**

### Verify Backend Deployment

After deployment, test the health endpoint:
```bash
curl https://your-app.onrender.com/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"..."}
```

**Note**: Free tier services sleep after 15 minutes of inactivity. The first request after sleep may take 30-60 seconds.

---

## Step 4: Deploy Frontend to Vercel

### Option A: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Navigate to frontend directory:
   ```bash
   cd packages/frontend
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Link to existing project or create new
   - Set project name: `kanban-frontend`
   - Set root directory: `packages/frontend`

5. Set environment variables in Vercel dashboard:
   - `EXPO_PUBLIC_API_URL`: Your Render backend URL (e.g., `https://kanban-api.onrender.com`)

### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `packages/frontend`
   - **Build Command**: `npx expo export --platform web`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`
5. Add environment variables:
   - `EXPO_PUBLIC_API_URL`: Your Render backend URL
6. Click **Deploy**

### Verify Frontend Deployment

1. Visit your Vercel URL
2. You should see the login/register screen
3. Test registration and login

---

## Step 5: Update CORS Configuration

After deploying the frontend, update the backend's CORS configuration:

1. Go to Render Dashboard → Your service → Environment
2. Update `CORS_ORIGIN` to your Vercel URL (e.g., `https://kanban-frontend.vercel.app`)
3. Render will automatically redeploy

---

## Step 6: Configure Custom Domain (Optional)

### Vercel (Frontend)
1. Go to your project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Render (Backend)
1. Go to your service → Settings → Custom Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Environment Variables Reference

### Backend (Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `10000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | Auto-generated |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc123...` |
| `CORS_ORIGIN` | Allowed frontend origin | `https://your-app.vercel.app` |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `https://kanban-api.onrender.com` |

---

## Monitoring and Maintenance

### Render
- View logs: Dashboard → Your service → Logs
- View metrics: Dashboard → Your service → Metrics
- Manual deploy: Dashboard → Your service → Manual Deploy

### Vercel
- View deployments: Dashboard → Your project → Deployments
- View analytics: Dashboard → Your project → Analytics
- View logs: Dashboard → Your project → Functions (for serverless)

### MongoDB Atlas
- View metrics: Clusters → Your cluster → Metrics
- View logs: Clusters → Your cluster → Logs
- Set up alerts: Project → Alerts

---

## Troubleshooting

### Backend won't start
1. Check Render logs for errors
2. Verify environment variables are set correctly
3. Ensure MongoDB Atlas allows connections from 0.0.0.0/0

### Frontend can't connect to backend
1. Check CORS_ORIGIN is set to your Vercel URL
2. Verify EXPO_PUBLIC_API_URL is correct
3. Check browser console for CORS errors

### Database connection fails
1. Verify MongoDB URI is correct
2. Check database user credentials
3. Ensure network access allows Render IPs

### File uploads fail
1. Verify Cloudinary credentials
2. Check file size limits (10MB default)
3. Verify allowed file types

---

## Cost Optimization Tips

1. **Render**: Free tier sleeps after 15min. Consider upgrading to Starter ($7/mo) for always-on.
2. **MongoDB Atlas**: Monitor storage usage. 512MB is sufficient for personal use.
3. **Cloudinary**: Optimize images before upload. Use transformations for thumbnails.
4. **Vercel**: Free tier is generous. Monitor bandwidth if you have many users.

---

## Scaling Beyond Free Tier

When you outgrow free tiers:

| Service | Upgrade Path | Cost |
|---------|--------------|------|
| Render | Starter plan | $7/month |
| MongoDB Atlas | M2 Shared | $9/month |
| Cloudinary | Plus plan | $89/month |
| Vercel | Pro plan | $20/month |

For real-time sync at scale, add Redis:
- **Upstash**: Free tier (10,000 commands/day)
- **Redis Cloud**: Free tier (30MB)
