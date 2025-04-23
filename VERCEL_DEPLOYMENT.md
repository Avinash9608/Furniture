# Deploying Shyam Furnitures to Vercel

This guide will help you deploy your Shyam Furnitures application to Vercel, with both frontend and backend running from a single link.

## Prerequisites

1. A GitHub account with your Shyam Furnitures repository
2. A MongoDB Atlas database (see MONGODB_ATLAS_SETUP.md)
3. A Vercel account

## Deployment Steps

### 1. Prepare Your Repository

Make sure your repository includes:
- `vercel.json` file (already included)
- Updated `server/index.js` for Vercel (already updated)
- `.env.example` file (already included)

### 2. Sign Up for Vercel

- Go to [Vercel](https://vercel.com)
- Sign up with your GitHub account

### 3. Import Your Repository

- Click "Add New" > "Project"
- Select your Shyam Furnitures repository
- Click "Import"

### 4. Configure Project Settings

- **Project Name**: Enter a name for your project (e.g., "shyam-furnitures")
- **Framework Preset**: Select "Other"
- **Root Directory**: Leave as is (should be the root of your repository)
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `client/dist`

### 5. Set Environment Variables

Click "Environment Variables" and add the following:

- `MONGO_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A secure random string for JWT authentication
- `NODE_ENV`: Set to `production`
- `BYPASS_AUTH`: Set to `false`

### 6. Deploy

- Click "Deploy"
- Wait for the deployment to complete

### 7. Verify Deployment

- Once deployment is complete, Vercel will provide you with a URL
- Visit the URL to verify that your frontend is working
- Test the API endpoints to verify that your backend is working

## Troubleshooting

### API Routes Not Working

If your API routes are not working, check:

1. **Vercel.json Configuration**:
   - Make sure your `vercel.json` file is correctly configured
   - Ensure the API routes are properly defined

2. **Environment Variables**:
   - Verify that all required environment variables are set in the Vercel dashboard

3. **Logs**:
   - Check the deployment logs in the Vercel dashboard for any errors

### Database Connection Issues

If you're having trouble connecting to your database:

1. **MongoDB Atlas Network Access**:
   - Make sure your MongoDB Atlas cluster allows access from anywhere (for Vercel deployments)

2. **Connection String**:
   - Double-check your MongoDB connection string
   - Make sure you've replaced `<password>` and `<dbname>` with the correct values

### Frontend Issues

If your frontend is not working correctly:

1. **Build Errors**:
   - Check the build logs in the Vercel dashboard
   - Make sure your build command is correct

2. **API Base URL**:
   - Verify that your frontend is using the correct API base URL
   - For Vercel deployments, this should be a relative URL like `/api`

## Custom Domain

To use a custom domain:

1. Go to your project in the Vercel dashboard
2. Click "Settings" > "Domains"
3. Add your domain and follow the instructions to configure DNS

## Continuous Deployment

Vercel automatically sets up continuous deployment from your GitHub repository. When you push changes to your repository, Vercel will automatically rebuild and redeploy your application.

## Monitoring

Vercel provides basic monitoring for your application:

1. Go to your project in the Vercel dashboard
2. Click "Analytics" to view performance metrics
3. Click "Logs" to view application logs
