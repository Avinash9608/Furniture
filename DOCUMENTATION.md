# Shyam Furnitures - Project Documentation

This document consolidates all the important information about the Shyam Furnitures project.

## Deployment Guide

For detailed deployment instructions, please refer to:
- DEPLOYMENT_GUIDE_V2.md - Comprehensive deployment guide
- RENDER_DEPLOYMENT_GUIDE.md - Render-specific deployment instructions
- SERVER_API_FIXES.md - Server API fixes documentation

## API Documentation

For API documentation, please refer to:
- API_FIXES_GUIDE.md - Comprehensive API fixes guide

## Environment Variables

For environment variable management, please refer to:
- ENV_MANAGEMENT.md - Environment variable management guide
- GIT_ENV_SECURITY.md - Git environment security guide

## Project Structure

The project is structured as follows:

```
/
├── client/             # React frontend
│   ├── dist/           # Built frontend files
│   ├── public/         # Public assets
│   └── src/            # Source code
├── server/             # Express backend
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # Express routes
│   ├── utils/          # Utility functions
│   └── uploads/        # Uploaded files
└── server.js           # Main server file
```

## Important Notes

1. The application uses MongoDB Atlas for the database
2. Authentication is handled using JWT
3. File uploads are handled using Cloudinary
4. The application is deployed on Render
