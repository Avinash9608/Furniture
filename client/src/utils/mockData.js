/**
 * Mock data for the application
 * Used when API calls fail or for testing
 */

/**
 * Generate mock orders data
 * @returns {Array} Array of mock order objects
 */
export const getMockOrders = () => {
  return [
    {
      _id: "mock-order-1",
      user: { 
        _id: "user123", 
        name: "John Doe",
        email: "john@example.com"
      },
      shippingAddress: {
        name: "John Doe",
        address: "123 Main St",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
        phone: "9876543210"
      },
      orderItems: [
        {
          name: "Luxury Sofa",
          quantity: 1,
          image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
          price: 12999,
          product: "prod1"
        }
      ],
      paymentMethod: "credit_card",
      taxPrice: 2340,
      shippingPrice: 0,
      totalPrice: 15339,
      isPaid: true,
      paidAt: new Date().toISOString(),
      status: "processing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: "mock-order-2",
      user: { 
        _id: "user456", 
        name: "Jane Smith",
        email: "jane@example.com"
      },
      shippingAddress: {
        name: "Jane Smith",
        address: "456 Oak St",
        city: "Delhi",
        state: "Delhi",
        postalCode: "110001",
        country: "India",
        phone: "9876543211"
      },
      orderItems: [
        {
          name: "Wooden Dining Table",
          quantity: 1,
          image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88",
          price: 8499,
          product: "prod2"
        },
        {
          name: "Dining Chair (Set of 4)",
          quantity: 1,
          image: "https://images.unsplash.com/photo-1551298370-9d3d53740c72",
          price: 12999,
          product: "prod3"
        }
      ],
      paymentMethod: "upi",
      taxPrice: 3870,
      shippingPrice: 500,
      totalPrice: 25868,
      isPaid: true,
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "delivered",
      isDelivered: true,
      deliveredAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: "mock-order-3",
      user: { 
        _id: "user789", 
        name: "Robert Johnson",
        email: "robert@example.com"
      },
      shippingAddress: {
        name: "Robert Johnson",
        address: "789 Pine St",
        city: "Bangalore",
        state: "Karnataka",
        postalCode: "560001",
        country: "India",
        phone: "9876543212"
      },
      orderItems: [
        {
          name: "King Size Bed",
          quantity: 1,
          image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
          price: 24999,
          product: "prod4"
        }
      ],
      paymentMethod: "cash_on_delivery",
      taxPrice: 4500,
      shippingPrice: 1000,
      totalPrice: 30499,
      isPaid: false,
      status: "shipped",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "mock-order-4",
      user: { 
        _id: "user101", 
        name: "Emily Davis",
        email: "emily@example.com"
      },
      shippingAddress: {
        name: "Emily Davis",
        address: "101 Maple St",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600001",
        country: "India",
        phone: "9876543213"
      },
      orderItems: [
        {
          name: "Wardrobe",
          quantity: 1,
          image: "https://images.unsplash.com/photo-1556020685-ae41abfc9365",
          price: 18999,
          product: "prod5"
        }
      ],
      paymentMethod: "bank_transfer",
      taxPrice: 3420,
      shippingPrice: 800,
      totalPrice: 23219,
      isPaid: true,
      paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "mock-order-5",
      user: { 
        _id: "user202", 
        name: "Michael Wilson",
        email: "michael@example.com"
      },
      shippingAddress: {
        name: "Michael Wilson",
        address: "202 Cedar St",
        city: "Hyderabad",
        state: "Telangana",
        postalCode: "500001",
        country: "India",
        phone: "9876543214"
      },
      orderItems: [
        {
          name: "Office Chair",
          quantity: 2,
          image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8",
          price: 7999,
          product: "prod6"
        }
      ],
      paymentMethod: "credit_card",
      taxPrice: 2880,
      shippingPrice: 0,
      totalPrice: 18878,
      isPaid: true,
      paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: "cancelled",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
};

/**
 * Generate mock payment requests data
 * @returns {Array} Array of mock payment request objects
 */
export const getMockPaymentRequests = () => {
  return [
    {
      _id: "mock-payment-request-1",
      user: {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com"
      },
      order: {
        _id: "order123",
        status: "processing",
        totalPrice: 12999
      },
      amount: 12999,
      paymentMethod: "upi",
      status: "pending",
      notes: "UPI ID: johndoe@upi",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: "mock-payment-request-2",
      user: {
        _id: "user456",
        name: "Jane Smith",
        email: "jane@example.com"
      },
      order: {
        _id: "order456",
        status: "shipped",
        totalPrice: 8499
      },
      amount: 8499,
      paymentMethod: "bank_transfer",
      status: "completed",
      notes: "Bank transfer reference: BT12345",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "mock-payment-request-3",
      user: {
        _id: "user789",
        name: "Robert Johnson",
        email: "robert@example.com"
      },
      order: {
        _id: "order789",
        status: "delivered",
        totalPrice: 15999
      },
      amount: 15999,
      paymentMethod: "credit_card",
      status: "completed",
      notes: "Credit card payment",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "mock-payment-request-4",
      user: {
        _id: "user101",
        name: "Emily Davis",
        email: "emily@example.com"
      },
      order: {
        _id: "order101",
        status: "pending",
        totalPrice: 18999
      },
      amount: 18999,
      paymentMethod: "upi",
      status: "pending",
      notes: "UPI ID: emily@upi",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "mock-payment-request-5",
      user: {
        _id: "user202",
        name: "Michael Wilson",
        email: "michael@example.com"
      },
      order: {
        _id: "order202",
        status: "cancelled",
        totalPrice: 7999
      },
      amount: 7999,
      paymentMethod: "bank_transfer",
      status: "rejected",
      notes: "Bank transfer reference: BT67890",
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
};
