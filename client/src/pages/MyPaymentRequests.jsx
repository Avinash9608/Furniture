import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paymentRequestsAPI } from '../utils/api';
import { formatPrice } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

const MyPaymentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch payment requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await paymentRequestsAPI.getMine();
        setRequests(response.data);
      } catch (err) {
        setError('Failed to load payment requests');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRequests();
    }
  }, [user]);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-8">
        <Alert type="error" message={error} />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-serif font-bold mb-6">My Payment Requests</h1>
        
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">No Payment Requests Found</h2>
            <p className="text-gray-600 mb-6">You haven't made any payment requests yet.</p>
            <Link to="/orders" className="btn-primary">
              View My Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map(request => (
              <div key={request._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <div className="flex items-center">
                      <h2 className="text-lg font-medium text-gray-900">Request #{request._id.substring(0, 8)}</h2>
                      <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Submitted on {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <span className="font-medium text-primary">{formatPrice(request.amount)}</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Order Information</h3>
                      <p className="text-sm text-gray-600">
                        Order ID: {request.order?._id ? request.order._id.substring(0, 8) : 'N/A'}
                      </p>
                      {request.order && (
                        <Link to={`/orders/${request.order._id}`} className="text-sm text-primary hover:underline">
                          View Order Details
                        </Link>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Method</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {request.paymentMethod.replace('_', ' ')}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Status</h3>
                      <div className="space-y-2">
                        {request.status === 'pending' && (
                          <p className="text-sm text-yellow-600">
                            Your payment request is being reviewed. We'll update you once it's processed.
                          </p>
                        )}
                        {request.status === 'completed' && (
                          <p className="text-sm text-green-600">
                            Your payment has been confirmed and processed successfully.
                          </p>
                        )}
                        {request.status === 'rejected' && (
                          <p className="text-sm text-red-600">
                            Your payment request was rejected. Please contact customer support for more information.
                          </p>
                        )}
                        {request.status === 'cancelled' && (
                          <p className="text-sm text-gray-600">
                            This payment request has been cancelled.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {request.notes && (
                    <div className="mt-6 bg-gray-50 p-4 rounded-md">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                      <p className="text-sm text-gray-600">{request.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPaymentRequests;
