# Setting Up MongoDB Atlas for Shyam Furnitures

This guide will help you set up a MongoDB Atlas database for your Shyam Furnitures application.

## Steps to Create a MongoDB Atlas Database

1. **Create a MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account or log in if you already have one

2. **Create a New Project**
   - Click on "Projects" in the top navigation
   - Click "New Project"
   - Name your project (e.g., "Shyam Furnitures")
   - Click "Create Project"

3. **Create a Database Cluster**
   - Click "Build a Database"
   - Choose the free tier option (M0)
   - Select your preferred cloud provider and region (choose a region close to your users)
   - Click "Create Cluster"

4. **Set Up Database Access**
   - In the left sidebar, click "Database Access" under Security
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter a username and password (save these securely)
   - Set user privileges to "Atlas admin"
   - Click "Add User"

5. **Configure Network Access**
   - In the left sidebar, click "Network Access" under Security
   - Click "Add IP Address"
   - For development, you can click "Allow Access from Anywhere" (not recommended for production)
   - For production, add the specific IP addresses that need access
   - Click "Confirm"

6. **Get Your Connection String**
   - In the left sidebar, click "Database" under Deployments
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user's password
   - Replace `<dbname>` with `shyam_furnitures`

7. **Add the Connection String to Your Environment Variables**
   - Add the connection string to your `.env` file as `MONGO_URI`
   - For Vercel deployment, add it to your environment variables in the Vercel dashboard

## Importing Initial Data

If you want to import initial data to your MongoDB Atlas database:

1. **Update the MongoDB URI in your .env file**
   - Replace the local MongoDB URI with your Atlas connection string

2. **Run the seeder script**
   ```
   npm run data:import
   ```

## Verifying the Connection

To verify that your application can connect to MongoDB Atlas:

1. **Start your application**
   ```
   npm run dev
   ```

2. **Check the console logs**
   - You should see "MongoDB connected successfully" in the console

## Troubleshooting

If you encounter connection issues:

1. **Check your connection string**
   - Make sure you've replaced `<password>` and `<dbname>` with the correct values

2. **Verify network access**
   - Make sure your IP address is allowed in the Network Access settings

3. **Check database user permissions**
   - Ensure your database user has the correct permissions

4. **Test the connection with MongoDB Compass**
   - Download [MongoDB Compass](https://www.mongodb.com/products/compass)
   - Use your connection string to connect and verify access
