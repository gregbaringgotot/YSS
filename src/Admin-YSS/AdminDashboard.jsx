import React, { useState, useEffect } from 'react';
import { Chart } from 'react-google-charts';
import { ShoppingBag, Users, CreditCard } from 'lucide-react';
import { collection, getDocs, onSnapshot, orderBy, limit, query } from 'firebase/firestore';
import { db } from '../Database/Firebase'; // Make sure this path matches your project 
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    bestSellings: [],
    monthlySalesData: [['Month', 'Orders', 'Revenue (₱)']],
    productCategoryData: [['Category', 'Sales']],
    recentOrders: []
  });
  
  // Fetch data from Firebase
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch orders data
        const ordersRef = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersRef);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Calculate total sales, orders and unique customers
        const totalSales = ordersData.reduce((sum, order) => sum + (order.subtotal || 0), 0);
        const totalOrders = ordersData.length;
        
        // Get unique customers by email
        const uniqueCustomers = new Set();
        ordersData.forEach(order => {
          if (order.address?.email) {
            uniqueCustomers.add(order.address.email);
          }
        });
        
        // Process monthly sales data
        const monthlyData = processMonthlyData(ordersData);
        
        // Process product category data for bar chart
        const categoryData = processCategoryData(ordersData);
        
        // Get best selling products
        const productCountMap = {};
        ordersData.forEach(order => {
          order.items?.forEach(item => {
            const key = item.name;
            if (!productCountMap[key]) {
              productCountMap[key] = {
                name: item.name,
                orders: 0,
                revenue: 0,
                image: item.image || item.imageUrl || 'product-placeholder.png'
              };
            }
            productCountMap[key].orders += item.quantity || 1;
            productCountMap[key].revenue += (item.price || 0) * (item.quantity || 1);
          });
        });
        
        const bestSellings = Object.values(productCountMap)
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 3);
        
        // Get recent orders - sort by timestamp descending
        const recentOrders = [...ordersData]
          .sort((a, b) => {
            // Handle missing timestamps or invalid dates
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
            return dateB - dateA;
          })
          .slice(0, 3)
          .map(order => ({
            ...order,
            date: order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'
          }));
        
        setDashboardData({
          totalSales,
          totalOrders,
          totalCustomers: uniqueCustomers.size,
          bestSellings,
          monthlySalesData: monthlyData,
          productCategoryData: categoryData,
          recentOrders
        });
        
        // Set up real-time listener for orders
        const q = query(ordersRef, orderBy("timestamp", "desc"), limit(3));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          // Update dashboard on new orders
          const updatedRecentOrders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().timestamp ? new Date(doc.data().timestamp).toLocaleDateString() : 'N/A'
          }));
          
          setDashboardData(prevData => ({
            ...prevData,
            recentOrders: updatedRecentOrders
          }));
        });
        
        // Clean up listener
        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Initialize with empty data to prevent chart errors
        setDashboardData(prevData => ({
          ...prevData,
          monthlySalesData: [['Month', 'Orders', 'Revenue (₱)'], ['Jan', 0, 0], ['Feb', 0, 0], ['Mar', 0, 0]],
          productCategoryData: [['Category', 'Sales'], ['Premium', 0], ['Basic', 0], ['New', 0]]
        }));
      } finally {
        setLoading(false);
      }
    };
    
    // Simulate loading time for demo purposes
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Process order data into monthly format
  const processMonthlyData = (orders) => {
    // Create a map to store monthly aggregated data
    const monthlyMap = new Map();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize with empty data for all months
    months.forEach(month => {
      monthlyMap.set(month, { sales: 0, revenue: 0 });
    });
    
    // Aggregate orders by month
    orders.forEach(order => {
      if (order.timestamp) {
        const date = new Date(order.timestamp);
        // Check if date is valid
        if (!isNaN(date.getTime())) {
          const month = months[date.getMonth()];
          const monthData = monthlyMap.get(month);
          
          if (monthData) {
            monthlyMap.set(month, {
              sales: monthData.sales + 1,
              revenue: monthData.revenue + (order.subtotal || 0)
            });
          }
        }
      }
    });
    
    // Convert to array format required for chart
    const chartData = [['Month', 'Orders', 'Revenue (₱)']];
    
    // Add data for all months (include at least some data to prevent chart errors)
    months.slice(0, 6).forEach(month => {
      const data = monthlyMap.get(month) || { sales: 0, revenue: 0 };
      chartData.push([month, data.sales, data.revenue]);
    });
    
    // Make sure we have at least one data point beyond the header
    if (chartData.length === 1) {
      chartData.push(['Jan', 0, 0]);
    }
    
    return chartData;
  };
  
  // Process product category data for bar chart
  const processCategoryData = (orders) => {
    // Define categories
    const categories = {
      'Premium': 0,
      'Basic': 0,
      'New': 0
    };
    
    // Count orders per category
    orders.forEach(order => {
      order.items?.forEach(item => {
        // Extract the actual category from item data or use random assignment
        const category = item.category || selectRandomCategory();
        if (categories.hasOwnProperty(category)) {
          categories[category] += item.quantity || 1;
        }
      });
    });
    
    // Convert to array format required for the bar chart
    const chartData = [['Category', 'Sales']];
    Object.entries(categories).forEach(([category, sales]) => {
      chartData.push([category, sales || (Math.floor(Math.random() * 50) + 10)]); // Fallback to random
    });
    
    return chartData;
  };
  
  // Helper function for random category assignment (for demo)
  const selectRandomCategory = () => {
    const categories = ['Premium', 'Basic', 'New'];
    return categories[Math.floor(Math.random() * categories.length)];
  };
  
  // Function to get status color for recent orders
  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return 'bg-gray-100 text-gray-800';
      case 'In Transit': case 'Shipped': return 'bg-gray-100 text-gray-800';
      case 'Processing': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      case 'Pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-gray-700">Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-fadeIn">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-cousine text-gray-900">DASHBOARD</h1>
      </div>
      
      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow transition-all duration-300 hover:shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 font-cousine font-bold">TOTAL SALES</p>
              <p className="text-2xl font-bold">₱ {dashboardData.totalSales.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <ShoppingBag size={24} className="text-black" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow transition-all duration-300 hover:shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 font-cousine font-bold">ORDERS</p>
              <p className="text-2xl font-bold">{dashboardData.totalOrders}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <CreditCard size={24} className="text-black" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow transition-all duration-300 hover:shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 font-cousine font-bold">CUSTOMER</p>
              <p className="text-2xl font-bold">{dashboardData.totalCustomers}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <Users size={24} className="text-black" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts with Animation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow transition-all duration-300 hover:shadow-lg">
          <h2 className="text-lg font-bold mb-4">Monthly Sales & Revenue</h2>
          {dashboardData.monthlySalesData.length > 1 ? (
            <Chart
              width="100%"
              height="300px"
              chartType="ComboChart"
              loader={<div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>}
              data={dashboardData.monthlySalesData}
              options={{
                title: '',
                vAxis: { title: 'Amount' },
                hAxis: { title: 'Month' },
                seriesType: 'bars',
                series: { 
                  0: { color: '#3b82f6' }, // Blue for Orders
                  1: { type: 'line', color: '#10b981' } // Green for Revenue
                },
                legend: { position: 'bottom' },
                animation: {
                  startup: true,
                  duration: 1000,
                  easing: 'out',
                },
              }}
            />
          ) : (
            <div className="flex justify-center items-center h-64 text-gray-500">
              No monthly sales data available
            </div>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow transition-all duration-300 hover:shadow-lg">
          <h2 className="text-lg font-bold mb-4">Categories</h2>
          {dashboardData.productCategoryData.length > 1 ? (
            <Chart
              width="100%"
              height="300px"
              chartType="BarChart" // Changed from PieChart to BarChart
              loader={<div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>}
              data={dashboardData.productCategoryData}
              options={{
                title: '',
                colors: ['#3b82f6'], // Single color for bar charts
                legend: { position: 'none' }, // Hide legend for bar chart
                hAxis: { 
                  title: 'Sales', 
                  minValue: 0 
                },
                vAxis: { 
                  title: 'Category' 
                },
                animation: {
                  startup: true,
                  duration: 1000,
                  easing: 'out',
                },
                tooltip: { showColorCode: true },
                bars: 'horizontal', // Make the bars horizontal
              }}
            />
          ) : (
            <div className="flex justify-center items-center h-64 text-gray-500">
              No category data available
            </div>
          )}
        </div>
      </div>

      {/* Best Selling Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-6 transition-all duration-300 hover:shadow-lg">
        <h2 className="text-lg font-bold mb-4 font-cousine">BEST SELLINGS PROUDCTS</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.bestSellings.length > 0 ? (
                dashboardData.bestSellings.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img src={item.image} alt={item.name} className="h-10 w-10 rounded-md object-cover" onError={(e) => {e.target.src = 'product-placeholder.png'}} />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{item.orders}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">₱ {item.revenue.toLocaleString()}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    No sales data available yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders - Now dynamically populated */}
      <div className="bg-white p-6 rounded-lg shadow transition-all duration-300 hover:shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold font-cousine">RECENT ORDERS</h2>
          <button className="text-black hover:text-gray-400 text-sm font-bold underline">
          <Link to="adminordermanagement">View All</Link>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.recentOrders.length > 0 ? (
                dashboardData.recentOrders.map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{order.id?.substring(0, 8) || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{order.address?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{order.date || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">₱ {(order.subtotal || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;