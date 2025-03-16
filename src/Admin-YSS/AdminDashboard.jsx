"use client"

import { useState, useEffect } from "react"
import { ShoppingBag, Users, CreditCard, TrendingUp, ClipboardList } from "lucide-react"
import { collection, getDocs, onSnapshot, orderBy, limit, query } from "firebase/firestore"
import { db } from "../Database/Firebase"
import { Link } from "react-router-dom"

// Import Recharts components - a more reliable alternative to Google Charts
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    bestSellings: [],
    recentOrders: [],
    monthlySalesData: [],
    weeklySalesData: [],
  })

  // Colors for pie chart
  const COLORS = ["#000000", "#666666", "#999999"]

  // Fetch orders data from Firebase
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const ordersCollection = collection(db, "orders")
        const querySnapshot = await getDocs(ordersCollection)

        const ordersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().timestamp ? new Date(doc.data().timestamp).toLocaleDateString() : "N/A",
        }))

        setOrders(ordersData)

        // Calculate dashboard metrics
        const totalSales = ordersData.reduce((sum, order) => sum + (order.subtotal || 0), 0)
        const totalOrders = ordersData.length

        // Get unique customers by email
        const uniqueCustomers = new Set()
        ordersData.forEach((order) => {
          if (order.address?.email) {
            uniqueCustomers.add(order.address.email)
          }
        })

        // Get best selling products
        const productCountMap = {}
        ordersData.forEach((order) => {
          order.items?.forEach((item) => {
            const key = item.name
            if (!productCountMap[key]) {
              productCountMap[key] = {
                name: item.name,
                orders: 0,
                revenue: 0,
                image: item.image || item.imageUrl || "product-placeholder.png",
              }
            }
            productCountMap[key].orders += item.quantity || 1
            productCountMap[key].revenue += (item.price || 0) * (item.quantity || 1)
          })
        })

        const bestSellings = Object.values(productCountMap)
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 4)

        // Get recent orders - sort by timestamp descending
        const recentOrders = [...ordersData]
          .sort((a, b) => {
            // Handle missing timestamps or invalid dates
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0)
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0)
            return dateB - dateA
          })
          .slice(0, 3)

        // Prepare monthly sales and expenses data for charts
        const monthlySalesData = prepareMonthlySalesData(ordersData)
        const weeklySalesData = prepareWeeklySalesData(ordersData)

        setDashboardData({
          totalSales,
          totalOrders,
          totalCustomers: uniqueCustomers.size,
          bestSellings,
          recentOrders,
          monthlySalesData,
          weeklySalesData,
        })

        // Set up real-time listener for orders
        const q = query(ordersCollection, orderBy("timestamp", "desc"), limit(3))
        const unsubscribe = onSnapshot(q, (snapshot) => {
          // Update dashboard on new orders
          const updatedRecentOrders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().timestamp ? new Date(doc.data().timestamp).toLocaleDateString() : "N/A",
          }))

          setDashboardData((prevData) => ({
            ...prevData,
            recentOrders: updatedRecentOrders,
          }))
        })

        // Clean up listener
        return () => unsubscribe()
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // Prepare monthly sales data for Recharts
  const prepareMonthlySalesData = (orders) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlySales = Array(12).fill(0)

    // Process each order
    orders.forEach((order) => {
      if (order.timestamp) {
        const date = new Date(order.timestamp)
        if (!isNaN(date.getTime())) {
          const month = date.getMonth()
          monthlySales[month] += order.subtotal || 0
        }
      }
    })

    // Format data for Recharts
    return months.map((month, index) => ({
      name: month,
      sales: monthlySales[index],
    }))
  }

  // Prepare weekly sales data for Recharts
  const prepareWeeklySalesData = (orders) => {
    // Initialize days of the week
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const weeklySales = Array(7).fill(0)

    // Get current date and calculate the start of the week (Sunday)
    const currentDate = new Date()
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    startOfWeek.setHours(0, 0, 0, 0) // Set to beginning of the day

    // Process each order
    orders.forEach((order) => {
      if (order.timestamp) {
        const orderDate = new Date(order.timestamp)
        // Check if order is from current week
        if (orderDate >= startOfWeek && orderDate <= currentDate) {
          const dayOfWeek = orderDate.getDay() // 0 for Sunday, 6 for Saturday
          weeklySales[dayOfWeek] += order.subtotal || 0
        }
      }
    })

    // Format data for Recharts - don't add random data, use actual data
    return daysOfWeek.map((day, index) => ({
      name: day,
      sales: weeklySales[index],
    }))
  }

  // Custom tooltip for pie chart to show percentage
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const totalValue = dashboardData.monthlyExpensesData.reduce((sum, item) => sum + item.value, 0)
      const percentage = ((data.value / totalValue) * 100).toFixed(2)

      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">₱ {data.value.toLocaleString()}</p>
          <p className="text-sm font-bold">{percentage}% of expenses</p>
        </div>
      )
    }
    return null
  }

  // Function to get status color for recent orders
  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-gray-100 text-black-800"
      case "In Transit":
      case "Shipped":
        return "bg-gray-100 text-black-800"
      case "Processing":
        return "bg-gray-100 text-black-800"
      case "Cancelled":
        return "bg-gray-100 text-black-800"
      case "Pending":
        return "bg-gray-100 text-black-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Format currency for tooltips
  const formatCurrency = (value) => {
    return `₱ ${value.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-gray-700">Loading Dashboard...</h2>
      </div>
    )
  }

  return (
    <div className="min-h-screen animate-fadeIn">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-cousine text-gray-900">DASHBOARD</h1>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow transition-all duration-300 hover:shadow-lg border-l-4 border-black">
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

        <div className="bg-white p-4 rounded-lg shadow transition-all duration-300 hover:shadow-lg border-l-4 border-black">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 font-cousine font-bold">TOTAL ORDERS</p>
              <p className="text-2xl font-bold">{dashboardData.totalOrders}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <CreditCard size={24} className="text-black" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow transition-all duration-300 hover:shadow-lg border-l-4 border-black">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 font-cousine font-bold">TOTAL CUSTOMER</p>
              <p className="text-2xl font-bold">{dashboardData.totalCustomers}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <Users size={24} className="text-black" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Sales Chart */}
      <div className="bg-white p-4 rounded-lg shadow transition-all duration-300 hover:shadow-lg mb-6">
        <div className="flex items-center mb-4">
          <TrendingUp size={20} className="text-black mr-2" />
          <h2 className="text-lg font-bold font-cousine">MONTHLY SALES</h2>
        </div>
        {dashboardData.monthlySalesData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.monthlySalesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => [`₱ ${value.toLocaleString()}`, "Sales"]} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#000000"
                  fill="#000000"
                  fillOpacity={0.2}
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64 text-gray-500">No monthly sales data available</div>
        )}
      </div>

      {/* Two Column Layout for Expenses Pie Chart and Best Selling Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Weekly Sales Chart */}
        <div className="bg-white p-4 rounded-lg shadow transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center mb-4">
            <TrendingUp size={20} className="text-black mr-2" />
            <h2 className="text-lg font-bold font-cousine">WEEKLY SALES</h2>
          </div>
          {dashboardData.weeklySalesData && dashboardData.weeklySalesData.length > 0 ? (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.weeklySalesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => [`₱ ${value.toLocaleString()}`, "Sales"]} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#000000"
                    fill="#000000"
                    fillOpacity={0.2}
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 text-gray-500">No weekly sales data available</div>
          )}
        </div>

        {/* Best Selling Products */}
        <div className="bg-white p-4 rounded-lg shadow transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center mb-4">
            <ShoppingBag size={20} className="text-black mr-2" />
            <h2 className="text-lg font-bold font-cousine">BEST SELLING PRODUCTS</h2>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "350px" }}>
            {dashboardData.bestSellings.length > 0 ? (
              dashboardData.bestSellings.map((item, index) => (
                <div key={index} className="flex items-center p-3 border-b last:border-b-0 hover:bg-gray-50">
                  <div className="h-16 w-16 flex-shrink-0 mr-4">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="h-full w-full rounded-md object-cover"
                      onError={(e) => {
                        e.target.src = "product-placeholder.png"
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-gray-500">{item.orders} orders</p>
                      <p className="font-bold">₱ {item.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No sales data available yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-6 rounded-lg shadow transition-all duration-300 hover:shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <ClipboardList size={20} className="text-black mr-2" />
            <h2 className="text-lg font-bold font-cousine">RECENT ORDERS</h2>
          </div>
          <button className="text-black hover:text-gray-400 text-sm font-bold underline">
            <Link to="adminordermanagement">View All</Link>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.recentOrders.length > 0 ? (
                dashboardData.recentOrders.map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{order.id?.substring(0, 8) || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{order.address?.name || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{order.date || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">₱ {(order.subtotal || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}
                      >
                        {order.status || "Pending"}
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
  )
}

export default AdminDashboard

