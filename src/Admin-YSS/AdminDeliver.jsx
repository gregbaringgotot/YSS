"use client"

import { useState, useEffect } from "react"
import {
  Search,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  Package,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Download,
  Banknote,
  CheckSquare,
  Truck,
} from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../Database/Firebase" // Adjust the import path as needed

function AdminDeliver() {
  // State management
  const [deliveredOrders, setDeliveredOrders] = useState([])
  const [receivedOrders, setReceivedOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sortBy, setSortBy] = useState("date")
  const [sortDirection, setSortDirection] = useState("desc")
  const [dateRange, setDateRange] = useState({
    start: "",
    end: new Date().toISOString().split("T")[0], // Today as default end date
  })
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    bestSellingProducts: [],
  })
  const [activeTab, setActiveTab] = useState("delivered") // "delivered" or "received"
  const ordersPerPage = 10

  // Fetch delivered and received orders from Firestore
  const fetchOrders = async () => {
    try {
      setIsLoading(true)

      // Fetch delivered orders
      const deliveredCollection = collection(db, "orders")
      const deliveredQuery = query(deliveredCollection, where("status", "==", "Delivered"))
      const deliveredSnapshot = await getDocs(deliveredQuery)

      const deliveredData = deliveredSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: new Date(doc.data().timestamp).toLocaleDateString(),
        timestamp: doc.data().timestamp,
      }))

      setDeliveredOrders(deliveredData)

      // Fetch received orders
      const receivedCollection = collection(db, "orders")
      const receivedQuery = query(receivedCollection, where("status", "==", "Received"))
      const receivedSnapshot = await getDocs(receivedQuery)

      const receivedData = receivedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: new Date(doc.data().timestamp).toLocaleDateString(),
        timestamp: doc.data().timestamp,
        receivedAt: doc.data().receivedAt,
      }))

      setReceivedOrders(receivedData)

      // Set filtered orders based on active tab
      if (activeTab === "delivered") {
        setFilteredOrders(deliveredData)
        calculateStats(deliveredData)
      } else {
        setFilteredOrders(receivedData)
        calculateStats(receivedData)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError("Failed to fetch orders. Please try again.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Calculate statistics
  const calculateStats = (orders) => {
    // Calculate total income
    const totalIncome = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0)

    // Calculate average order value
    const avgOrderValue = orders.length > 0 ? totalIncome / orders.length : 0

    // Find best selling products
    const productCounts = {}
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        if (productCounts[item.name]) {
          productCounts[item.name].quantity += item.quantity
          productCounts[item.name].revenue += item.price * item.quantity
        } else {
          productCounts[item.name] = {
            name: item.name,
            quantity: item.quantity,
            revenue: item.price * item.quantity,
            image: item.image || item.imageUrl,
          }
        }
      })
    })

    // Convert to array and sort by quantity
    const bestSellingProducts = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    setStats({
      totalIncome,
      totalOrders: orders.length,
      avgOrderValue,
      bestSellingProducts,
    })
  }

  // Initial fetch
  useEffect(() => {
    fetchOrders()
    // Set default date range to last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    setDateRange({
      ...dateRange,
      start: thirtyDaysAgo.toISOString().split("T")[0],
    })
  }, [activeTab])

  // Refresh function
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchOrders()
  }

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setSearchTerm("")

    if (tab === "delivered") {
      setFilteredOrders(deliveredOrders)
      calculateStats(deliveredOrders)
    } else {
      setFilteredOrders(receivedOrders)
      calculateStats(receivedOrders)
    }
  }

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to ascending
      setSortBy(field)
      setSortDirection("asc")
    }
  }

  // Filter by date range
  const applyDateFilter = () => {
    if (!dateRange.start && !dateRange.end) {
      setFilteredOrders(activeTab === "delivered" ? deliveredOrders : receivedOrders)
      return
    }

    let filtered = activeTab === "delivered" ? [...deliveredOrders] : [...receivedOrders]

    if (dateRange.start) {
      const startDate = new Date(dateRange.start)
      filtered = filtered.filter((order) => new Date(order.timestamp) >= startDate)
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter((order) => new Date(order.timestamp) <= endDate)
    }

    setFilteredOrders(filtered)
    calculateStats(filtered)
    setShowDateFilter(false)
  }

  // Filter and sort orders
  useEffect(() => {
    let result = activeTab === "delivered" ? deliveredOrders : receivedOrders

    // Search by ID or customer name
    if (searchTerm) {
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.address?.name && order.address.name.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Sort the results
    result = [...result].sort((a, b) => {
      let valA, valB

      // Determine which values to compare based on sortBy
      switch (sortBy) {
        case "customer":
          valA = a.address?.name?.toLowerCase() || ""
          valB = b.address?.name?.toLowerCase() || ""
          break
        case "total":
          valA = a.subtotal || 0
          valB = b.subtotal || 0
          break
        case "date":
          valA = new Date(a.timestamp || 0)
          valB = new Date(b.timestamp || 0)
          break
        case "receivedDate":
          valA = a.receivedAt ? new Date(a.receivedAt) : new Date(0)
          valB = b.receivedAt ? new Date(b.receivedAt) : new Date(0)
          break
        default:
          valA = a.id
          valB = b.id
      }

      // Compare based on direction
      if (sortDirection === "asc") {
        return valA > valB ? 1 : -1
      } else {
        return valA < valB ? 1 : -1
      }
    })

    setFilteredOrders(result)
    calculateStats(result)
    setCurrentPage(1)
  }, [searchTerm, deliveredOrders, receivedOrders, sortBy, sortDirection, activeTab])

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortBy !== field) return null
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="inline ml-1" />
    ) : (
      <ArrowDown size={14} className="inline ml-1" />
    )
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers =
      activeTab === "delivered"
        ? ["Order ID", "Customer", "Date", "Total", "Delivery Date"]
        : ["Order ID", "Customer", "Order Date", "Received Date", "Total"]

    const csvData = filteredOrders.map((order) => {
      if (activeTab === "delivered") {
        return [
          order.id,
          order.address?.name || "N/A",
          order.date,
          order.subtotal?.toFixed(2) || "0.00",
          order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "N/A",
        ]
      } else {
        return [
          order.id,
          order.address?.name || "N/A",
          order.date,
          order.receivedAt ? new Date(order.receivedAt).toLocaleDateString() : "N/A",
          order.subtotal?.toFixed(2) || "0.00",
        ]
      }
    })

    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += headers.join(",") + "\n"
    csvData.forEach((row) => {
      csvContent += row.join(",") + "\n"
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${activeTab}_orders_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Order Details Modal
  const OrderDetailsModal = ({ order, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center">
              {activeTab === "delivered" ? (
                <Truck size={18} className="text-blue-500 mr-2" />
              ) : (
                <CheckSquare size={18} className="text-green-500 mr-2" />
              )}
              {activeTab === "delivered" ? "Delivered" : "Received"} Order Details
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Order Information</h3>
              <p>
                <strong>Order ID:</strong> {order.id}
              </p>
              <p>
                <strong>Order Date:</strong> {order.date}
              </p>
              <p>
                <strong>Total Amount:</strong> ₱{order.subtotal?.toFixed(2) || 0}
              </p>
              <p>
                <strong>Delivery Date:</strong>{" "}
                {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "Not recorded"}
              </p>
              {activeTab === "received" && order.receivedAt && (
                <p>
                  <strong>Received Date:</strong> {new Date(order.receivedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <p>
                <strong>Name:</strong> {order.address?.name || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {order.address?.email || "N/A"}
              </p>
              <p>
                <strong>Phone:</strong> {order.address?.phone || "N/A"}
              </p>
              <p>
                <strong>Address:</strong> {order.address?.street || "N/A"}, {order.address?.city || "N/A"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Order Items</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Product</th>
                  <th className="border p-2 text-center">Size</th>
                  <th className="border p-2 text-center">Quantity</th>
                  <th className="border p-2 text-right">Price</th>
                  <th className="border p-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="border p-2">
                      <div className="flex items-center">
                        {(item.image || item.imageUrl) && (
                          <img
                            src={item.image || item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-md mr-2"
                          />
                        )}
                        {item.name}
                      </div>
                    </td>
                    <td className="border p-2 text-center">{item.size || "N/A"}</td>
                    <td className="border p-2 text-center">{item.quantity}</td>
                    <td className="border p-2 text-right">₱{item.price.toFixed(2)}</td>
                    <td className="border p-2 text-right">₱{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan="4" className="border p-2 text-right">
                    Total:
                  </td>
                  <td className="border p-2 text-right">₱{order.subtotal?.toFixed(2) || "0.00"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto ">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold font-cousine text-gray-800">ORDER MANAGEMENT</h1>

          <div className="flex flex-wrap gap-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={`${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </button>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download size={18} />
              Export CSV
            </button>

            {/* Date Filter Button */}
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Calendar size={18} />
              Date Filter
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => handleTabChange("delivered")}
            className={`px-6 py-3 font-medium ${
              activeTab === "delivered" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center">
              <Truck className="w-5 h-5 mr-2" />
              Delivered Orders
            </div>
          </button>
          <button
            onClick={() => handleTabChange("received")}
            className={`px-6 py-3 font-medium ${
              activeTab === "received" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center">
              <CheckSquare className="w-5 h-5 mr-2" />
              Received Orders
            </div>
          </button>
        </div>

        {/* Date Filter Panel */}
        {showDateFilter && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="font-semibold mb-3">Filter by Date Range</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="border rounded-md p-2"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="border rounded-md p-2"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={applyDateFilter}
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Income Card */}
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center border-l-4 border-black">
            <div className="bg-gray-100 p-3 rounded-full mr-4">
              <Banknote size={24} className="text-black" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Total Income {activeTab === "delivered" ? "Delivered" : "Received"}
              </p>
              <h3 className="text-2xl font-bold">₱{stats.totalIncome.toFixed(2)}</h3>
            </div>
          </div>

          {/* Total Orders Card */}
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center border-l-4 border-black">
            <div className="bg-gray-100 p-3 rounded-full mr-4">
              <Package size={24} className="text-black" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Total Orders {activeTab === "delivered" ? "Delivered" : "Received"}
              </p>
              <h3 className="text-2xl font-bold">{stats.totalOrders}</h3>
            </div>
          </div>

          {/* Average Order Value Card */}
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center border-l-4 border-black">
            <div className="bg-gray-100 p-3 rounded-full mr-4">
              <TrendingUp size={24} className="text-black" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Average Order Value</p>
              <h3 className="text-2xl font-bold">₱{stats.avgOrderValue.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex items-center border rounded-md px-2 flex-grow">
              <Search size={20} className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search by order ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 outline-none w-full"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative inline-block">
              <button
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md"
                onClick={() => document.getElementById("sort-dropdown").classList.toggle("hidden")}
              >
                <Filter size={16} />
                <span>Sort</span>
              </button>
              <div
                id="sort-dropdown"
                className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border"
              >
                <div className="py-1">
                  <button
                    onClick={() => handleSort("date")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                  >
                    <span>Order Date</span>
                    {getSortIcon("date")}
                  </button>
                  {activeTab === "received" && (
                    <button
                      onClick={() => handleSort("receivedDate")}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>Received Date</span>
                      {getSortIcon("receivedDate")}
                    </button>
                  )}
                  <button
                    onClick={() => handleSort("customer")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                  >
                    <span>Customer Name</span>
                    {getSortIcon("customer")}
                  </button>
                  <button
                    onClick={() => handleSort("total")}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                  >
                    <span>Total Amount</span>
                    {getSortIcon("total")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === "delivered" ? "Delivery Date" : "Received Date"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No {activeTab === "delivered" ? "delivered" : "received"} orders found
                    </td>
                  </tr>
                ) : (
                  currentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.address?.name || "N/A"}</div>
                        <div className="text-xs text-gray-500">{order.address?.email || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {activeTab === "delivered"
                            ? order.deliveryDate
                              ? new Date(order.deliveryDate).toLocaleDateString()
                              : "Not recorded"
                            : order.receivedAt
                              ? new Date(order.receivedAt).toLocaleDateString()
                              : "Not recorded"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₱{order.subtotal?.toFixed(2) || "0.00"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => setSelectedOrder(order)} className="text-black hover:text-gray-700 mr-3">
                          <FileText size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredOrders.length > ordersPerPage && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstOrder + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(indexOfLastOrder, filteredOrders.length)}</span> of{" "}
                    <span className="font-medium">{filteredOrders.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {Array.from({ length: Math.ceil(filteredOrders.length / ordersPerPage) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => paginate(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i + 1
                            ? "z-10 bg-black text-white border-black"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300"
                        }`}
                      >
                        {i + 1}
                      </button>
                    )).slice(
                      Math.max(0, currentPage - 3),
                      Math.min(Math.ceil(filteredOrders.length / ordersPerPage), currentPage + 2),
                    )}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === Math.ceil(filteredOrders.length / ordersPerPage)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  )
}

export default AdminDeliver

