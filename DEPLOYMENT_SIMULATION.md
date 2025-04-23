# Shyam Furnitures Deployment Simulation

## Step 1: Vercel Login
```
$ vercel login
> We sent an email to your@email.com. Please follow the steps provided inside it and make sure the security code matches Wg4k.
> Success! Email authenticated
> Congratulations! You are now logged in. In order to deploy something, run `vercel`.
```

## Step 2: Vercel Deployment
```
$ vercel
Vercel CLI 41.6.2
? Set up and deploy "D:\DELTA PROJECT\Furniture"? [Y/n] y
? Which scope do you want to deploy to? Your Account
? Link to existing project? [y/N] n
? What's your project's name? shyam-furnitures
? In which directory is your code located? ./
? Want to override the settings? [y/N] y
? Which settings would you like to override? [Press <space> to select, <a> to toggle all, <i> to invert selection]
✓ Build Command
✓ Output Directory
✓ Development Command
? What's your Build Command? npm run vercel-build
? What's your Output Directory? client/dist
? What's your Development Command? npm run dev
? Want to modify these settings? [y/N] n

🔗  Linked to your-account/shyam-furnitures (created .vercel)
🔍  Inspect: https://vercel.com/your-account/shyam-furnitures/[deployment-id] [1s]
✅  Production: https://shyam-furnitures.vercel.app [copied to clipboard] [1m]
```

## Step 3: Environment Variables Setup
After deployment, you would go to the Vercel dashboard:

1. Navigate to https://vercel.com/dashboard
2. Select your project "shyam-furnitures"
3. Click on "Settings" tab
4. Click on "Environment Variables"
5. Add the following environment variables:
   - `MONGO_URI`: mongodb+srv://avinashmadhukar4:wwtcgIAvcC8WNAPY@cluster0.dpeo7nm.mongodb.net/shyam_furnitures?retryWrites=true&w=majority&appName=Cluster0
   - `JWT_SECRET`: dG8sY2FuSSUo*22dk@fj9s8
   - `JWT_EXPIRE`: 30d
   - `JWT_COOKIE_EXPIRE`: 30
   - `NODE_ENV`: production
   - `BYPASS_AUTH`: false
   - `CLOUDINARY_CLOUD_NAME`: dfdtdqumn
   - `CLOUDINARY_API_KEY`: 759566998672355
   - `CLOUDINARY_API_SECRET`: o8IRXq5nkO3L9XnvDMNhM1bxyiY

## Step 4: Redeploy with Environment Variables
```
$ vercel --prod
Vercel CLI 41.6.2
🔍  Inspect: https://vercel.com/your-account/shyam-furnitures/[deployment-id] [1s]
✅  Production: https://shyam-furnitures.vercel.app [copied to clipboard] [1m]
```

## Step 5: Verify Deployment
After deployment, you would verify that your application is working correctly by:

1. Visiting your deployment URL (e.g., https://shyam-furnitures.vercel.app)
2. Testing the frontend functionality (navigation, dark mode, etc.)
3. Testing the backend functionality (API endpoints, authentication, etc.)
4. Testing the admin panel (login, product management, etc.)

## What's Actually Happening During Deployment

When you deploy to Vercel, the following happens:

1. **Build Phase**:
   - Vercel clones your repository
   - Runs the build command (`npm run vercel-build`)
   - This builds your React frontend and outputs it to the `client/dist` directory

2. **Deployment Phase**:
   - Vercel deploys your Node.js backend as a serverless function
   - Deploys your frontend static files
   - Sets up routing according to your vercel.json configuration

3. **Runtime**:
   - When a user visits your site, Vercel serves the frontend static files
   - API requests are routed to your Node.js backend
   - Your backend connects to MongoDB Atlas for data storage
