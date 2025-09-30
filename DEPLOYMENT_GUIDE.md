# Vercel Deployment Guide for RFP Management System

This guide will help you deploy both the frontend (Next.js) and backend (Node.js/Express) applications to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas Account**: For production database (free tier available)
3. **GitHub Account**: To connect your repositories
4. **Node.js**: Installed locally for testing

## Step 1: Prepare Your Repositories

### Option A: Deploy from GitHub (Recommended)
1. Push your code to GitHub repositories
2. Connect GitHub to Vercel

### Option B: Deploy from Local Machine
1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`

## Step 2: Set Up MongoDB Atlas (Production Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier available)
3. Create a database user
4. Whitelist all IP addresses (0.0.0.0/0) for Vercel
5. Get your connection string

## Step 3: Deploy Backend to Vercel

### 3.1 Deploy Backend
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your backend repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

### 3.2 Set Environment Variables for Backend
In Vercel dashboard, go to your backend project → Settings → Environment Variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rfp_management?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-for-production
JWT_EXPIRES_IN=24h
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
FRONTEND_URL=https://your-frontend-app.vercel.app
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### 3.3 Deploy Backend
Click "Deploy" and wait for deployment to complete. Note the deployment URL (e.g., `https://your-backend-app.vercel.app`)

## Step 4: Deploy Frontend to Vercel

### 4.1 Deploy Frontend
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your frontend repository
4. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 4.2 Set Environment Variables for Frontend
In Vercel dashboard, go to your frontend project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-app.vercel.app/api
```

### 4.3 Deploy Frontend
Click "Deploy" and wait for deployment to complete. Note the deployment URL (e.g., `https://your-frontend-app.vercel.app`)

## Step 5: Update CORS Configuration

After both deployments are complete:

1. Go to your backend project in Vercel
2. Update the `FRONTEND_URL` environment variable with your actual frontend URL
3. Redeploy the backend

## Step 6: Test Your Deployment

1. Visit your frontend URL
2. Test user registration and login
3. Test RFP creation and management
4. Check browser console for any errors

## Important Notes

### File Uploads
- Vercel has limitations with file uploads in serverless functions
- Consider using cloud storage (AWS S3, Cloudinary) for production file uploads
- Current setup stores files in `/tmp` which is ephemeral

### Database
- Use MongoDB Atlas for production
- Ensure your cluster allows connections from Vercel IPs
- Consider connection pooling for better performance

### Environment Variables
- Never commit `.env` files to version control
- Use Vercel's environment variable system for production secrets
- Different environments (development, preview, production) can have different values

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` in backend matches your frontend domain
   - Check that CORS middleware is properly configured

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist settings
   - Ensure database user has proper permissions

3. **Build Failures**
   - Check Node.js version compatibility
   - Review build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`

4. **Environment Variables Not Working**
   - Verify variable names match exactly
   - Check that variables are set for the correct environment
   - Redeploy after changing environment variables

### Useful Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from local machine
vercel

# Check deployment logs
vercel logs

# Link local project to Vercel
vercel link
```

## Production Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Environment variables set in Vercel
- [ ] CORS configuration updated with production URLs
- [ ] Frontend and backend deployed successfully
- [ ] All features tested in production
- [ ] Error monitoring set up (optional)
- [ ] Domain configured (optional)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review browser console for frontend errors
3. Test API endpoints directly using tools like Postman
4. Check MongoDB Atlas logs for database issues

Your RFP Management System should now be live on Vercel! 🚀
