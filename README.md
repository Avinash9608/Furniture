# Shyam Furnitures - Furniture Shop Website

A full-featured, modern, dynamic eCommerce website for a furniture shop named "Shyam Furnitures", located in Sharsha, Bihar.

## Tech Stack

- **Frontend**: React.js with Vite
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (with Mongoose)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Image Storage**: Local static folder (with option for Cloudinary)
- **Authentication**: JWT-based for admin panel

## Features

### Customer-Facing Pages

- **Home Page**: Hero section, categories grid, featured products, testimonials
- **About Page**: Store mission, vision, and values
- **Products Page**: Dynamic fetching, filtering, sorting, search
- **Product Detail Page**: Full product details, image gallery, add to cart
- **Cart Page**: View added products, quantity control, checkout
- **Contact Page**: Contact form, WhatsApp chat button, embedded map

### Admin Panel Features

- **Dashboard**: View stats (products, categories, messages, users)
- **Product Management**: Add, edit, delete products
- **Category Management**: Add, edit, delete categories
- **Orders**: View and manage customer orders
- **Contact Management**: View and manage customer messages

## Deployment on Vercel

This application is configured to be deployed on Vercel with both frontend and backend running from a single link.

### Prerequisites for Deployment

1. A MongoDB Atlas account and database
2. A Vercel account

### Deployment Steps

1. Fork or clone this repository
2. Create a MongoDB Atlas database
3. Create a `.env` file based on `.env.example` with your MongoDB Atlas connection string
4. Install the Vercel CLI: `npm install -g vercel`
5. Login to Vercel: `vercel login`
6. Deploy to Vercel: `vercel`
7. Set up environment variables in the Vercel dashboard:
   - MONGO_URI
   - JWT_SECRET
   - NODE_ENV=production
   - BYPASS_AUTH=false

## Getting Started (Local Development)

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/shyam-furnitures.git
   cd shyam-furnitures
   ```

2. Install all dependencies (root, client, and server)

   ```
   npm run install-all
   ```

3. Set up environment variables

   - The `.env` file is already created in the server directory
   - Update MongoDB URI if needed

4. Seed the database with initial data

   ```
   npm run data:import
   ```

5. Run the development servers (both frontend and backend concurrently)

   ```
   npm run dev
   ```

   This will start:

   - Backend server at http://localhost:5000
   - Frontend development server at http://localhost:3000

## Project Structure

```
shyam-furnitures/
├── client/                 # React frontend
│   ├── public/             # Public assets
│   ├── src/                # Source files
│   │   ├── assets/         # Static assets
│   │   ├── components/     # Reusable components
│   │   ├── context/        # Context API files
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   ├── App.jsx         # Main App component
│   │   └── main.jsx        # Entry point
│   ├── index.html          # HTML template
│   └── package.json        # Frontend dependencies
│
├── server/                 # Express backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── uploads/            # Uploaded files
│   ├── utils/              # Utility functions
│   ├── index.js            # Server entry point
│   └── package.json        # Backend dependencies
│
└── README.md               # Project documentation
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout user

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `POST /api/products/:id/reviews` - Create product review

### Categories

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create new category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Contact

- `POST /api/contact` - Create new contact message
- `GET /api/contact` - Get all contact messages (Admin)
- `GET /api/contact/:id` - Get single contact message (Admin)
- `PUT /api/contact/:id` - Update contact message status (Admin)
- `DELETE /api/contact/:id` - Delete contact message (Admin)

### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/myorders` - Get logged in user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/status` - Update order status (Admin)
- `PUT /api/orders/:id/pay` - Update order to paid (Admin)

## License

This project is licensed under the MIT License.

## Acknowledgements

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
