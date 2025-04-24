# Environment Variable Management

This document explains how environment variables are managed in this project.

## Overview

Environment variables are used to store configuration settings and sensitive information such as API keys, database credentials, and other secrets. These variables should never be committed to the repository.

## Environment Files

The project uses several types of environment files:

- `.env`: Main environment file for development
- `.env.production`: Environment file for production
- `.env.test`: Environment file for testing
- `.env.render`: Environment file for Render deployment
- `.env.example`: Example environment file with placeholder values (safe to commit)

## Security Measures

### 1. Git Ignore Rules

All `.env` files are ignored by Git using the following patterns in `.gitignore`:

```
.env
.env.*
.env*
*.env
```

This ensures that no environment files are accidentally committed to the repository.

### 2. Example Files

We provide `.env.example` files with placeholder values to serve as templates for developers. These files are safe to commit as they don't contain any real credentials.

### 3. Deployment Configuration

For deployment platforms like Render and Vercel, environment variables should be set through their respective dashboards rather than committing `.env` files.

## Setting Up Environment Variables

### For Local Development

1. Copy the example file to create your own environment file:
   ```
   cp .env.example .env
   ```

2. Edit the `.env` file with your actual credentials:
   ```
   MONGO_URI=your_actual_mongodb_uri
   JWT_SECRET=your_actual_jwt_secret
   # etc.
   ```

### For Client-Side Environment Variables

1. Copy the client example file:
   ```
   cp client/.env.example client/.env
   ```

2. Edit the `client/.env` file with your client-side variables.

### For Production Deployment

Set environment variables through your deployment platform's dashboard or CLI:

- **Render**: Environment tab in the web service settings
- **Vercel**: Environment Variables section in the project settings
- **Heroku**: Using the Heroku CLI or dashboard

## Best Practices

1. **Never commit real credentials** to the repository
2. **Use different values** for development, testing, and production
3. **Rotate secrets regularly**, especially if you suspect they may have been compromised
4. **Limit access** to production environment variables
5. **Use placeholder values** in example files
6. **Document all environment variables** in the example files

## Troubleshooting

If you encounter issues with environment variables:

1. Check that your `.env` file exists and has the correct values
2. Verify that the environment variables are being loaded correctly
3. Restart your application after changing environment variables
4. Check for typos in variable names
