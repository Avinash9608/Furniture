# Hover-Activated Navbar Implementation

This README provides instructions on how to implement and use the hover-activated navbar in your application.

## Available Implementations

There are three different implementations of the hover-activated navbar:

1. **Pure CSS Hover Navbar** (`HoverNavbar.jsx`)
   - Uses CSS for hover effects
   - No JavaScript needed for hover functionality
   - Smooth transitions with CSS
   - Mobile-friendly with click-based dropdowns

2. **Customizable Navbar** (`CustomHoverNavbar.jsx`)
   - Fully customizable through props
   - Configure menu items, logo, and theme colors
   - Support for right or left aligned dropdowns
   - Dark mode compatible

3. **React State-Based Navbar** (Current `Navbar.jsx`)
   - Uses React state and effects for hover detection
   - Includes delay mechanism to prevent flickering
   - More programmatic control over behavior

## How to Use

### Option 1: Use the Current Navbar Implementation

The current `Navbar.jsx` component already has hover functionality implemented using React state and effects. It tracks hover states for both the dropdown trigger and the dropdown menu.

### Option 2: Switch to Pure CSS Hover Implementation

If you prefer a simpler implementation with less JavaScript:

1. Import the CSS file in your Navbar component:
   ```jsx
   import "../styles/NavbarHover.css";
   ```

2. Add the appropriate CSS classes to your dropdown elements:
   ```jsx
   <div className="hover-dropdown">
     <button className="...">
       All Products
       <svg className="dropdown-arrow ...">...</svg>
     </button>
     <div className="hover-dropdown-menu theme-bg-primary ...">
       {/* Dropdown content */}
     </div>
   </div>
   ```

3. Remove the JavaScript-based hover state management (useState, useEffect, onMouseEnter, onMouseLeave)

### Option 3: Use the Customizable Navbar

For a more flexible approach:

1. Import the CustomHoverNavbar component:
   ```jsx
   import CustomHoverNavbar from "./components/CustomHoverNavbar";
   ```

2. Use it with your custom configuration:
   ```jsx
   <CustomHoverNavbar 
     logo="Shyam Furnitures"
     logoLink="/"
     menuItems={[
       { name: "Home", path: "/" },
       {
         name: "All Products",
         submenu: [
           { name: "Sofa", path: "/products?category=sofa" },
           { name: "Beds", path: "/products?category=beds" },
           { name: "Tables", path: "/products?category=tables" },
           { name: "Chairs", path: "/products?category=chairs" },
           { name: "Wardrobes", path: "/products?category=wardrobes" },
         ],
       },
       { name: "About", path: "/about" },
       { name: "Contact", path: "/contact" },
       {
         name: "Login/Register",
         submenu: [
           { name: "Login", path: "/login" },
           { name: "Register", path: "/register" },
         ],
         align: "right",
       },
     ]}
     theme={{
       bgColor: "theme-bg-primary",
       textColor: "theme-text-primary",
       hoverTextColor: "text-primary",
       hoverBgColor: "bg-gray-100",
       logoColor: "text-primary",
     }}
   />
   ```

## Demo Pages

You can view the different navbar implementations at these routes:

- `/hover-navbar` - Pure CSS hover implementation
- `/custom-navbar` - Customizable navbar implementation
- `/navbar-demo.html` - Standalone HTML version

## Key Features

- **Hover-activated dropdowns** that stay open when hovering over the submenu
- **Smooth transitions** for a polished user experience
- **Responsive design** that works on all device sizes
- **Dark mode support** with appropriate color schemes
- **Accessible markup** with proper ARIA attributes
- **Clean, modern design** using Tailwind CSS
