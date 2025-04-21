import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatPrice, formatDate } from '../utils/format';
import Button from '../components/Button';
import Alert from '../components/Alert';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock order data - would fetch from API in real implementation
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockOrders = [
          {
            _id: 'ord123456',
            createdAt: new Date('2023-05-15'),
            totalPrice: 24999,
            status: 'Delivered',
            isPaid: true,
            items: [
              { 
                product: { 
                  _id: 'prod1', 
                  name: 'Modern Sofa Set', 
                  images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc'] 
                },
                quantity: 1,
                price: 24999
              }
            ]
          },
          {
            _id: 'ord789012',
            createdAt: new Date('2023-06-20'),
            totalPrice: 18999,
            status: 'Shipped',
            isPaid: true,
            items: [
              { 
                product: { 
                  _id: 'prod2', 
                  name: 'Wooden Dining Table', 
                  images: ['https://images.unsplash.com/photo-1533090161767-e6ffed986c88'] 
                },
                quantity: 1,
                price: 18999
              }
            ]
          },
          {
            _id: 'ord345678',
            createdAt: new Date(),
            totalPrice: 9999,
            status: 'Processing',
            isPaid: true,
            items: [
              { 
                product: { 
                  _id: 'prod3', 
                  name: 'Ergonomic Office Chair', 
                  images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8'] 
                },
                quantity: 1,
                price: 9999
              }
            ]
          }
        ];
        
        setOrders(mockOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Shipped':
        return 'bg-purple-100 text-purple-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          <h3 className="text-xl font-bold mb-2">No Orders Found</h3>
          <p className="text-gray-600 mb-4">
            You haven't placed any orders yet.
          </p>
          <Link to="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <h2 className="text-lg font-semibold">Order #{order._id.substring(order._id.length - 6)}</h2>
                    <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row sm:items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                    <Link
                      to={`/orders/${order._id}`}
                      className="mt-2 sm:mt-0 sm:ml-4 text-primary hover:text-primary-dark font-medium text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                {order.items.map((item, index) => (
                  <div 
                    key={index}
                    className={`flex items-center py-4 ${
                      index !== order.items.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    
                    <div className="ml-4 flex-1 flex flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>
                            <Link to={`/products/${item.product._id}`}>
                              {item.product.name}
                            </Link>
                          </h3>
                          <p className="ml-4">{formatPrice(item.price)}</p>
                        </div>
                      </div>
                      <div className="flex-1 flex items-end justify-between text-sm">
                        <p className="text-gray-500">Qty {item.quantity}</p>
                        
                        {order.status === 'Delivered' && (
                          <button
                            className="text-primary hover:text-primary-dark font-medium"
                            onClick={() => alert('Review functionality would go here')}
                          >
                            Write a Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <p>Total</p>
                  <p>{formatPrice(order.totalPrice)}</p>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {order.isPaid ? 'Paid' : 'Payment pending'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
