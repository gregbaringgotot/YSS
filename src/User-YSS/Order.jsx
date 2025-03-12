import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db,auth } from '../Database/Firebase';

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const fetchOrders = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No authenticated user found.");
        return [];
      }
  
      const ordersRef = collection(db, "orders");
      
      // Ensure the Firestore field matches the rules (userId, NOT userUID)
      const q = query(ordersRef, where("userId", "==", user.uid));
      
      const querySnapshot = await getDocs(q);
  
      const orders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      return orders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  };
  // Loading state with skeleton loader
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-cousine">ORDER DETAILS</h1>
          <p className="text-gray-600 mt-2">View and track your purchase history</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="flex mb-6 space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-cousine">ORDER DETAILS</h1>
          <p className="text-gray-600 mt-2">View and track your purchase history</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-cousine">ORDER DETAILS</h1>
          <p className="text-gray-600 mt-2">View and track your purchase history</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          <button 
            onClick={() => navigate('/shop')} 
            className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-md transition-colors"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl mt-10">
      <div className="text-center mb-8 mt-10">
        <h1 className="text-3xl font-bold font-cousine">ORDER DETAILS</h1>
        <p className="text-gray-600 mt-2">View and track your purchase history</p>
      </div>

      {orders.map((order) => {
        const orderDate = new Date(order.timestamp);
        const deliveryDate = new Date(order.address.deliveryDate);
        
        return (
          <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            {/* Order Header */}
            <div className="bg-gray-50 p-6 border-b">
              <div className="flex flex-wrap justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold flex items-center">
                    Order #{order.id.substring(0, 8)}
                    <span className={`ml-3 px-3 py-1 text-xs rounded-full ${
                      order.status === 'Completed' ? 'bg-gray-200 text-white-800' :
                      order.status === 'Processing' ? 'bg-gray-200 text-white-800' :
                      order.status === 'Shipped' ? 'bg-gray-200 text-white-800' :
                      'bg-gray-200 text-white-800'
                    }`}>
                      {order.status}
                    </span>
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Ordered on {orderDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <span className="font-bold text-lg">₱{order.subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-start">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.image || item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <div className="mt-1 flex text-sm text-gray-500 space-x-4">
                          <p>Size: {item.size}</p>
                          <p>Qty: {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 font-medium text-gray-900">
                      ₱{item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 border-t">
              {/* Shipping Details */}
              <div>
                <h3 className="text-lg font-medium mb-3">Shipping Details</h3>
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <p className="font-medium">{order.address.name}</p>
                  <p className="text-gray-700 mt-1">{order.address.street}</p>
                  <p className="text-gray-700">{order.address.city}</p>
                  <div className="mt-3 pt-3 border-t border-dashed">
                    <p className="text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                      {order.address.phone}
                    </p>
                    <p className="text-gray-700 flex items-center mt-1">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                      {order.address.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="text-lg font-medium mb-3">Order Summary</h3>
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-gray-600">Subtotal</p>
                      <p>₱{order.subtotal.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-600">Shipping</p>
                      <p>{order.shippingCost ? `₱${order.shippingCost.toFixed(2)}` : 'Free'}</p>
                    </div>
                    
                    {order.discount && (
                      <div className="flex justify-between text-green-600">
                        <p>Discount</p>
                        <p>-₱{order.discount.toFixed(2)}</p>
                      </div>
                    )}
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <p>Total</p>
                        <p>₱{order.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center text-sm">
                      <svg className="w-5 h-5 text-black mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <span>Expected delivery on {deliveryDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Order;