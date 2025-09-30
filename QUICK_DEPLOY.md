# Quick Deploy to Vercel

## 🚀 One-Click Deployment

### Prerequisites
1. Install Vercel CLI: `npm install -g vercel`
2. Login to Vercel: `vercel login`
3. Set up MongoDB Atlas (free tier available)

### Deploy Both Apps
```bash
# Run the deployment script
./deploy.sh
```

### Manual Deployment

#### Backend
```bash
cd backend
vercel --prod
```

#### Frontend
```bash
cd frontend
vercel --prod
```

## 🔧 Environment Variables

### Backend (Set in Vercel Dashboard)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rfp_management
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-frontend-app.vercel.app
```

### Frontend (Set in Vercel Dashboard)
```
NEXT_PUBLIC_API_URL=https://your-backend-app.vercel.app/api
```

## 📝 Steps Summary

1. **Deploy Backend** → Get backend URL
2. **Deploy Frontend** → Get frontend URL  
3. **Update Environment Variables** in Vercel dashboard
4. **Update CORS** with frontend URL in backend
5. **Test** your deployed application

## 🆘 Need Help?

See `DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.
