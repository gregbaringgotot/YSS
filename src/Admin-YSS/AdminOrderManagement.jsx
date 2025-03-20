"use client"

import { useState, useEffect, useRef } from "react"
import {
  Check,
  X,
  Clock,
  Package,
  TruckIcon,
  RefreshCw,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  ArrowUp,
  ArrowDown,
  Mail,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "../Database/Firebase" // Adjust the import path as needed

function AdminOrderManagement() {
  // 1. Change the initial state for selectedStatus to "Placed" instead of "All"
  const [selectedStatus, setSelectedStatus] = useState("Placed")
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sortBy, setSortBy] = useState("date")
  const [sortDirection, setSortDirection] = useState("desc")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const sortDropdownRef = useRef(null)
  const ordersPerPage = 5
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setShowSortDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // 2. Modify the fetchOrders function to set selectedStatus to "Placed" after refresh
  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const ordersCollection = collection(db, "orders")
      const querySnapshot = await getDocs(ordersCollection)

      const ordersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: new Date(doc.data().timestamp).toLocaleDateString(),
      }))

      setOrders(ordersData)
      setFilteredOrders(ordersData)
      setSelectedStatus("Placed") // Reset to "Placed" after refresh
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError("Failed to fetch orders. Please try again.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchOrders()
  }, [])

  // Refresh function
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchOrders()
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
    setShowSortDropdown(false)
  }

  // Filter, search, and sort orders
  useEffect(() => {
    let result = orders

    // Filter by status
    if (selectedStatus !== "All") {
      result = result.filter((order) => order.status === selectedStatus)
    }

    // Filter by date range
    if (startDate) {
      const startDateObj = new Date(startDate)
      result = result.filter((order) => new Date(order.timestamp) >= startDateObj)
    }

    if (endDate) {
      const endDateObj = new Date(endDate)
      endDateObj.setHours(23, 59, 59, 999)
      result = result.filter((order) => new Date(order.timestamp) <= endDateObj)
    }

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
        case "status":
          valA = a.status || ""
          valB = b.status || ""
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
    setCurrentPage(1)
  }, [selectedStatus, searchTerm, orders, sortBy, sortDirection, startDate, endDate])

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Function to initiate delete process
  const initiateDeleteOrder = (order) => {
    setOrderToDelete(order)
    setShowDeleteModal(true)
  }

  // Function to delete an order from the database
  const deleteOrder = async () => {
    if (!orderToDelete) return

    setIsDeleting(true)
    try {
      const orderRef = doc(db, "orders", orderToDelete.id)
      await deleteDoc(orderRef)

      // Update local state by removing the deleted order
      const updatedOrders = orders.filter((order) => order.id !== orderToDelete.id)
      setOrders(updatedOrders)

      alert("Order deleted successfully")
    } catch (error) {
      console.error("Error deleting order:", error)
      alert("Failed to delete order. Please try again.")
    } finally {
      setShowDeleteModal(false)
      setOrderToDelete(null)
      setIsDeleting(false)
    }
  }

  // Update the updateOrderStatus function
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId)
      await updateDoc(orderRef, {
        status: newStatus,
      })

      // Update local state while preserving other properties
      const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      setOrders(updatedOrders)

      alert("Status updated successfully")
    } catch (error) {
      console.error("Error updating order status:", error)
      alert("Failed to update order status. Please try again.")
    }
  }

  // Order status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-gray-100 text-black-800"
      case "Processing":
        return "bg-gray-100 text-black-800"
      case "Shipped":
        return "bg-gray-100 text-black-800"
      case "Cancelled":
        return "bg-gray-100 text-black-800"
      case "Delivered":
        return "bg-gray-100 text-black-800"
      case "Placed":
        return "bg-gray-100 text-black-800"
      default:
        return "bg-gray-200 text-black-800"
    }
  }

  // Helper function to get status button colors for modal
  const getStatusButtonColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-black hover:bg-gray-600 text-white"
      case "Processing":
        return "bg-black hover:bg-gray-600 text-white"
      case "Shipped":
        return "bg-black hover:bg-gray-600 text-white"
      case "Delivered":
        return "bg-black hover:bg-gray-600 text-white"
      case "Cancelled":
        return "bg-black hover:bg-gray-600 text-white"
      case "Placed":
        return "bg-black hover:bg-gray-600 text-white"
      default:
        return "bg-black hover:bg-gray-600 text-white"
    }
  }

  // Helper function to get status icons for modal
  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock size={16} className="inline" />
      case "Processing":
        return <Package size={16} className="inline" />
      case "Shipped":
        return <TruckIcon size={16} className="inline" />
      case "Delivered":
        return <Check size={16} className="inline" />
      case "Cancelled":
        return <X size={16} className="inline" />
      case "Placed":
        return <Clock size={16} className="inline" />
      default:
        return null
    }
  }

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortBy !== field) return null
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="inline ml-1" />
    ) : (
      <ArrowDown size={14} className="inline ml-1" />
    )
  }

  const formatPrice = (price) => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => {
    if (!orderToDelete) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center mb-4 text-red-600">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-semibold">Confirm Deletion</h3>
          </div>

          <div className="mb-6">
            <p className="mb-2">Are you sure you want to delete this order?</p>
            <div className="bg-red-50 p-3 rounded-md text-sm text-red-800">
              This action cannot be undone. The order will be permanently removed from the system.
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={deleteOrder}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center"
            >
              {isDeleting ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Delete Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // View Order Details Modal with status update buttons
  const OrderDetailsModal = ({ order, onClose }) => {
    const statusOptions = ["Placed", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [selectedDate, setSelectedDate] = useState("")
    const [currentOrder, setCurrentOrder] = useState(order)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [updatingStatusId, setUpdatingStatusId] = useState(null)
    const [isUpdatingDate, setIsUpdatingDate] = useState(false)
    const [isSendingEmail, setIsSendingEmail] = useState(false)

    // Update order status with loading state
    const handleUpdateStatus = async (orderId, newStatus) => {
      setIsUpdatingStatus(true)
      setUpdatingStatusId(newStatus)
      try {
        const orderRef = doc(db, "orders", orderId)
        await updateDoc(orderRef, {
          status: newStatus,
        })

        // Update local state while preserving other properties
        const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
        setOrders(updatedOrders)

        // Update the current order being viewed in the modal
        setCurrentOrder({
          ...currentOrder,
          status: newStatus,
        })

        alert("Status updated successfully")
      } catch (error) {
        console.error("Error updating order status:", error)
        alert("Failed to update order status. Please try again.")
      } finally {
        setIsUpdatingStatus(false)
        setUpdatingStatusId(null)
      }
    }

    // Update delivery date function
    const updateDeliveryDate = async () => {
      if (!selectedDate) return

      setIsUpdatingDate(true)
      try {
        const orderRef = doc(db, "orders", order.id)
        await updateDoc(orderRef, {
          deliveryDate: selectedDate,
        })

        // Update local state for the order list
        const updatedOrders = orders.map((o) => (o.id === order.id ? { ...o, deliveryDate: selectedDate } : o))
        setOrders(updatedOrders)

        // Update the current order being viewed in the modal
        setCurrentOrder({
          ...currentOrder,
          deliveryDate: selectedDate,
        })

        // Close date picker
        setShowDatePicker(false)

        // Show success notification or feedback
        alert("Delivery date updated successfully!")
      } catch (error) {
        console.error("Error updating delivery date:", error)
        alert("Failed to update delivery date. Please try again.")
      } finally {
        setIsUpdatingDate(false)
      }
    }

    // Send order confirmation email function
    const sendOrderConfirmationEmail = async () => {
      setIsSendingEmail(true)
      try {
        const response = await fetch("http://localhost:5000/send-order-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: order.id,
            customerEmail: order.address?.email,
            customerName: order.address?.name,
            items: order.items,
            subtotal: order.subtotal,
            status: order.status,
            deliveryDate: order.deliveryDate || null,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          alert("Order details email sent successfully to customer!")
        } else {
          throw new Error(data.message || "Failed to send email")
        }
      } catch (error) {
        console.error("Error sending email:", error)
        alert("Failed to send order details email. Please try again.")
      } finally {
        setIsSendingEmail(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
          {/* Header with close button */}
          <div className="flex justify-between items-center mb-6 pb-3 border-b">
            <h2 className="text-2xl font-bold">Order #{order.id}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Order summary section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Order Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{order.date}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium px-3 py-1 rounded-full text-xs ${getStatusColor(currentOrder.status)}`}>
                    {currentOrder.status || "Pending"}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">₱{order.subtotal ? formatPrice(order.subtotal) : "0.00"}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="flex justify-between items-start">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-right max-w-[70%] break-words">{order.address?.name || "N/A"}</span>
                </p>
                <p className="flex justify-between items-start">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-right max-w-[70%] break-words">
                    {order.address?.email || "N/A"}
                  </span>
                </p>
                <p className="flex justify-between items-start">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-right max-w-[70%] break-words">
                    {order.address?.phone || "N/A"}
                  </span>
                </p>
                <p className="flex justify-between items-start">
                  <span className="text-gray-600">Address:</span>
                  <span className="font-medium text-right max-w-[70%] break-words">
                    {order.address?.street || "N/A"}, {order.address?.city || "N/A"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Panels - Reorganized as requested */}
          <div className="space-y-6 mb-6">
            {/* 1. Order Status Panel */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-semibold flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Order Status
                </h3>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(order.id, status)}
                      disabled={currentOrder.status === status || isUpdatingStatus}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center ${
                        currentOrder.status === status
                          ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                          : getStatusButtonColor(status)
                      }`}
                    >
                      {isUpdatingStatus && updatingStatusId === status ? (
                        <RefreshCw size={16} className="mr-1 animate-spin" />
                      ) : (
                        getStatusIcon(status)
                      )}
                      <span className="ml-1">{status}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Delivery Date Panel */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-semibold flex items-center">
                  <TruckIcon className="mr-2 h-5 w-5" />
                  Delivery Date
                </h3>
              </div>
              <div className="p-4">
                {currentOrder.status === "Shipped" || currentOrder.status === "Delivered" ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-gray-600 mb-1">Current Delivery Date:</p>
                      <p className="font-medium">
                        {currentOrder.deliveryDate
                          ? new Date(currentOrder.deliveryDate).toLocaleDateString()
                          : "To be scheduled"}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      disabled={isUpdatingDate}
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center"
                    >
                      {showDatePicker ? <X className="mr-2 h-4 w-4" /> : <Clock className="mr-2 h-4 w-4" />}
                      {showDatePicker ? "Cancel" : "Set Delivery Date"}
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600 italic">Delivery date can be set after order is shipped</p>
                )}

                {showDatePicker && currentOrder.status === "Shipped" && (
                  <div className="mt-4 border rounded-md p-4 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2">Select a new delivery date:</p>
                    <input
                      type="date"
                      className="border rounded-md p-2 w-full mb-3"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]} // Set minimum date to today
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={updateDeliveryDate}
                        disabled={!selectedDate || isUpdatingDate}
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                      >
                        {isUpdatingDate ? (
                          <>
                            <RefreshCw size={16} className="mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Save Date"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Customer Communication Panel */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-semibold flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Customer Communication
                </h3>
              </div>
              <div className="p-4">
                <div className="flex flex-col space-y-3">
                  <p className="text-sm text-gray-600">Send order details and updates to the customer via email.</p>
                  <button
                    onClick={sendOrderConfirmationEmail}
                    disabled={isSendingEmail}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center"
                  >
                    {isSendingEmail ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Order Details Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Order Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-center">Size</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, index) => (
                    <tr key={index} className={index !== order.items.length - 1 ? "border-b" : ""}>
                      <td className="p-3">
                        <div className="flex items-center">
                          {(item.image || item.imageUrl) && (
                            <img
                              src={item.image || item.imageUrl}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-md mr-2"
                            />
                          )}
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">{item.size || "N/A"}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">₱{formatPrice(item.price)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 border-t">
                    <td colSpan="3" className="p-3 text-right font-semibold">
                      Total:
                    </td>
                    <td className="p-3 text-right font-semibold">
                      ₱{order.subtotal ? formatPrice(order.subtotal) : "0.00"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-gray-700">Loading Orders...</h2>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto">
        {/* 3. Replace the header section with date filter beside refresh button */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold font-cousine text-gray-800">ORDER MANAGEMENT</h1>

          <div className="flex items-center gap-3">
            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  id="start-date"
                  className="border rounded-md p-1.5"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="From"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  id="end-date"
                  className="border rounded-md p-1.5"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="To"
                />
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={`${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Orders"}
            </button>
          </div>
        </div>

        {/* 4. Remove the standalone date filter section */}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {["Placed", "Pending", "Processing", "Shipped", "Delivered", "Cancelled", "All"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-md text-sm transition duration-150 ${
                  selectedStatus === status ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Search Bar */}
            <div className="flex items-center border rounded-md px-2 flex-grow">
              <Search size={20} className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search Bar....."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 outline-none w-full"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative inline-block" ref={sortDropdownRef}>
              <button
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                <Filter size={16} />
                <span>Sort</span>
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <div className="py-1">
                    <button
                      onClick={() => handleSort("date")}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>Date</span>
                      {getSortIcon("date")}
                    </button>
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
                    <button
                      onClick={() => handleSort("status")}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>Status</span>
                      {getSortIcon("status")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. Replace the Sales Analytics section with just Revenue by Status */}
        {/* Revenue by Status */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Revenue by Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {["Placed", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => {
              const total = orders
                .filter((order) => order.status === status)
                .reduce((sum, order) => sum + (order.subtotal || 0), 0)
              return (
                <div key={status} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-2 text-gray-600">{status}</h3>
                  <p className="text-xl font-bold">₱{formatPrice(total)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {orders.filter((order) => order.status === status).length} orders
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order List */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">No orders found.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-4 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort("id")}>
                    <div className="flex items-center">Order ID {getSortIcon("id")}</div>
                  </th>
                  <th className="p-4 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort("customer")}>
                    <div className="flex items-center">Customer {getSortIcon("customer")}</div>
                  </th>
                  <th className="p-4 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort("date")}>
                    <div className="flex items-center">Date {getSortIcon("date")}</div>
                  </th>
                  <th className="p-4 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort("total")}>
                    <div className="flex items-center">Total {getSortIcon("total")}</div>
                  </th>
                  <th className="p-4 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort("status")}>
                    <div className="flex items-center">Status {getSortIcon("status")}</div>
                  </th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{order.id}</td>
                    <td className="p-4">{order.address?.name || "N/A"}</td>
                    <td className="p-4">{order.date}</td>
                    <td className="p-4">₱{order.subtotal ? formatPrice(order.subtotal) : "0.00"}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                        {order.status || "Pending"}
                      </span>
                    </td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-black hover:text-gray-700 p-1"
                        title="View Details"
                      >
                        <FileText size={20} />
                      </button>
                      <button
                        onClick={() => initiateDeleteOrder(order)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete Order"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {filteredOrders.length > ordersPerPage && (
            <div className="flex flex-col md:flex-row justify-between items-center p-4">
              <div className="text-sm text-gray-600 mb-2 md:mb-0">
                Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredOrders.length)} of{" "}
                {filteredOrders.length} orders
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="disabled:opacity-50 hover:bg-gray-100 p-2 rounded"
                >
                  <ChevronLeft size={20} />
                </button>
                {Array.from({ length: Math.ceil(filteredOrders.length / ordersPerPage) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`w-8 h-8 rounded-full ${
                      currentPage === i + 1 ? "bg-black text-white" : "hover:bg-gray-100"
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
                  disabled={indexOfLastOrder >= filteredOrders.length}
                  className="disabled:opacity-50 hover:bg-gray-100 p-2 rounded"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && <DeleteConfirmationModal />}
    </div>
  )
}

export default AdminOrderManagement

