"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getAuth } from "firebase/auth"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "../Database/Firebase"
import {
  Truck,
  Package,
  Calendar,
  Phone,
  Mail,
  X,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  CheckSquare,
} from "lucide-react"

const Order = () => {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [cancellingOrder, setCancellingOrder] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelSuccess, setCancelSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("orders") // "orders" or "history"
  const navigate = useNavigate()
  const auth = getAuth()

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const ordersData = await fetchOrders()
        // Sort orders by date (newest first)
        ordersData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        setOrders(ordersData)
        setIsLoading(false)
      } catch (err) {
        console.error("Error loading orders:", err)
        setError("Failed to load orders. Please try again.")
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const user = auth.currentUser
      if (!user) {
        console.error("No authenticated user found.")
        return []
      }

      const ordersRef = collection(db, "orders")

      // Query orders using userUID as in the Checkout component
      const q = query(ordersRef, where("userUID", "==", user.uid))

      const querySnapshot = await getDocs(q)

      const orders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      return orders
    } catch (error) {
      console.error("Error fetching orders:", error)
      return []
    }
  }

  // Handle Continue Shopping
  const handleContinueShopping = () => {
    navigate("/shop")
  }

  // Open cancel modal
  const openCancelModal = (orderId) => {
    setCancellingOrder(orderId)
    setShowCancelModal(true)
    setCancelReason("")
    setCancelSuccess("")
  }

  // Close cancel modal
  const closeCancelModal = () => {
    setShowCancelModal(false)
    setCancellingOrder(null)
  }

  // Cancel order
  const handleCancelOrder = async () => {
    if (!cancellingOrder || !cancelReason) return

    try {
      const orderRef = doc(db, "orders", cancellingOrder)
      await updateDoc(orderRef, {
        status: "Cancelled",
        cancelReason: cancelReason,
        cancelledAt: new Date().toISOString(),
      })

      // Update the order in the local state
      const updatedOrders = orders.map((order) =>
        order.id === cancellingOrder
          ? {
              ...order,
              status: "Cancelled",
              cancelReason: cancelReason,
              cancelledAt: new Date().toISOString(),
            }
          : order,
      )

      setOrders(updatedOrders)
      setCancelSuccess("Order cancelled successfully")

      // Close the modal after 2 seconds
      setTimeout(() => {
        setShowCancelModal(false)
        setCancellingOrder(null)
        setCancelSuccess("")
      }, 2000)
    } catch (err) {
      console.error("Error cancelling order:", err)
      setError("Failed to cancel order. Please try again.")
    }
  }

  // Mark order as received
  const handleOrderReceived = async (orderId) => {
    try {
      const orderRef = doc(db, "orders", orderId)
      await updateDoc(orderRef, {
        status: "Received",
        receivedAt: new Date().toISOString(),
      })

      // Update the order in the local state
      const updatedOrders = orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "Received",
              receivedAt: new Date().toISOString(),
            }
          : order,
      )

      setOrders(updatedOrders)

      // Switch to history tab
      setActiveTab("history")
    } catch (err) {
      console.error("Error marking order as received:", err)
      setError("Failed to update order. Please try again.")
    }
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Placed":
        return "bg-gray-100 text-gray-800"
      case "Processing":
        return "bg-gray-100 text-gray-800"
      case "Shipped":
        return "bg-gray-100 text-gray-800"
      case "Delivered":
        return "bg-gray-100 text-gray-800"
      case "Received":
        return "bg-gray-100 text-gray-800"
      case "Cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Placed":
        return <Clock className="w-4 h-4 mr-1" />
      case "Processing":
        return <Clock className="w-4 h-4 mr-1" />
      case "Shipped":
        return <Truck className="w-4 h-4 mr-1" />
      case "Delivered":
        return <CheckCircle className="w-4 h-4 mr-1" />
      case "Received":
        return <CheckSquare className="w-4 h-4 mr-1" />
      case "Cancelled":
        return <XCircle className="w-4 h-4 mr-1" />
      default:
        return <Clock className="w-4 h-4 mr-1" />
    }
  }

  // Check if order can be cancelled
  const canCancelOrder = (status) => {
    return ["Placed", "Processing"].includes(status)
  }

  // Check if order can be marked as received
  const canMarkAsReceived = (status) => {
    return status === "Delivered"
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "orders") {
      return order.status !== "Received" && order.status !== "Cancelled"
    } else {
      return order.status === "Received" || order.status === "Cancelled"
    }
  })

  // Loading state with skeleton loader
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl mt-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-cousine">MY ORDERS</h1>
          <p className="text-gray-600 mt-2">Track your orders and delivery status</p>
        </div>
        <div className="grid gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
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
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl mt-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-cousine">MY ORDERS</h1>
          <p className="text-gray-600 mt-2">Track your orders and delivery status</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="text-red-600" size={40} />
          </div>
          <h3 className="text-xl font-medium text-red-800 mb-2">Unable to load orders</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl mt-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-cousine">MY ORDERS</h1>
          <p className="text-gray-600 mt-2">Track your orders and delivery status</p>
        </div>
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <div className="mb-6">
            <Package className="mx-auto text-gray-400" size={60} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 font-cousine">No orders yet</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            You haven't placed any orders yet. Browse our collection and find something you love!
          </p>
          <button
            onClick={handleContinueShopping}
            className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors"
          >
            Start Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl mt-16">
      <div className="flex items-center mb-8">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold font-cousine">MY ORDERS</h1>
          <p className="text-gray-600 mt-1">Track your orders and delivery status</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "orders" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Active Orders
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === "history" ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Order History
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <div className="mb-6">
            <Package className="mx-auto text-gray-400" size={60} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 font-cousine">
            {activeTab === "orders" ? "No active orders" : "No order history"}
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {activeTab === "orders"
              ? "You don't have any active orders at the moment."
              : "Your order history is empty."}
          </p>
          {activeTab === "history" && (
            <button
              onClick={() => setActiveTab("orders")}
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded hover:bg-gray-300 transition-colors mr-4"
            >
              View Active Orders
            </button>
          )}
          <button
            onClick={handleContinueShopping}
            className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
              {/* Order Header */}
              <div className="bg-gray-50 p-6 border-b">
                <div className="flex flex-wrap justify-between items-start">
                  <div>
                    <div className="flex items-center mb-2">
                      <h2 className="text-lg font-semibold mr-3">Order #{order.id.substring(0, 8)}</h2>
                      <span
                        className={`px-3 py-1 text-xs rounded-full flex items-center ${getStatusColor(order.status)}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Placed on {formatDate(order.timestamp)}</p>
                    {order.cancelledAt && (
                      <p className="text-sm text-red-600 mt-1">
                        Cancelled on {formatDate(order.cancelledAt)}
                        {order.cancelReason && ` - Reason: ${order.cancelReason}`}
                      </p>
                    )}
                    {order.receivedAt && (
                      <p className="text-sm text-green-600 mt-1">Received on {formatDate(order.receivedAt)}</p>
                    )}
                  </div>
                  <div className="mt-2 sm:mt-0 flex flex-col items-end">
                    <span className="font-bold text-lg">₱{order.subtotal.toFixed(2)}</span>
                    {canCancelOrder(order.status) && (
                      <button
                        onClick={() => openCancelModal(order.id)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 transition-colors flex items-center"
                      >
                        <X className="w-4 h-4 mr-1" /> Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Progress */}
              {order.status !== "Cancelled" && order.status !== "Received" && (
                <div className="px-4 py-3 border-b bg-gray-50">
                  <div className="relative">
                    <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-gray-200">
                      <div
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-black"
                        style={{
                          width:
                            order.status === "Placed"
                              ? "25%"
                              : order.status === "Processing"
                                ? "50%"
                                : order.status === "Shipped"
                                  ? "75%"
                                  : order.status === "Delivered"
                                    ? "100%"
                                    : "0%",
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <div
                        className={`flex flex-col items-center ${order.status === "Placed" || order.status === "Processing" || order.status === "Shipped" || order.status === "Delivered" ? "text-black font-medium" : ""}`}
                      >
                        <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center mb-1">
                          1
                        </div>
                        Order Placed
                      </div>
                      <div
                        className={`flex flex-col items-center ${order.status === "Processing" || order.status === "Shipped" || order.status === "Delivered" ? "text-black font-medium" : ""}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full ${order.status === "Processing" || order.status === "Shipped" || order.status === "Delivered" ? "bg-black text-white" : "bg-gray-200"} flex items-center justify-center mb-1`}
                        >
                          2
                        </div>
                        Processing
                      </div>
                      <div
                        className={`flex flex-col items-center ${order.status === "Shipped" || order.status === "Delivered" ? "text-black font-medium" : ""}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full ${order.status === "Shipped" || order.status === "Delivered" ? "bg-black text-white" : "bg-gray-200"} flex items-center justify-center mb-1`}
                        >
                          3
                        </div>
                        Shipped
                      </div>
                      <div
                        className={`flex flex-col items-center ${order.status === "Delivered" ? "text-black font-medium" : ""}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full ${order.status === "Delivered" ? "bg-black text-white" : "bg-gray-200"} flex items-center justify-center mb-1`}
                        >
                          4
                        </div>
                        Delivered
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="p-4 border-b flex-grow">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-1 text-gray-600" />
                  Order Items
                </h3>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center py-2 border-b last:border-b-0">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.image || item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="ml-2 flex-1">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
                        <div className="mt-1 flex flex-wrap text-xs text-gray-500 gap-x-2">
                          <p>Size: {item.size}</p>
                          <p>Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping & Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Shipping Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Truck className="mr-2 text-gray-600" size={20} />
                    Shipping Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 mr-2 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-sm text-gray-500">Delivery Date</p>
                        <p className="font-medium">
                          {order.deliveryDate ? formatDate(order.deliveryDate) : "To be scheduled"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mail className="w-5 h-5 mr-2 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-sm text-gray-500">Email</p>
                        <p
                          className="font-medium truncate hover:text-clip hover:overflow-visible"
                          title={order.address?.email}
                        >
                          {order.address?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="w-5 h-5 mr-2 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{order.address?.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Payment Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>₱{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">COD Fee:</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>₱{order.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address with Received Button */}
              <div className="p-6 bg-gray-50 border-t">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Shipping Address</h3>
                    <p className="font-medium">{order.address?.name}</p>
                    <p>{order.address?.street}</p>
                    <p>{order.address?.city}</p>
                  </div>
                  {canMarkAsReceived(order.status) && (
                    <button
                      onClick={() => handleOrderReceived(order.id)}
                      className="bg-black hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Mark as Received
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Cancel Order</h3>
              <button onClick={closeCancelModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            {cancelSuccess ? (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-green-600">{cancelSuccess}</p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-gray-600">
                  Please provide a reason for cancelling this order. This will help us improve our service.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Reason</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Select a reason</option>
                    <option value="Changed my mind">Changed my mind</option>
                    <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                    <option value="Ordered by mistake">Ordered by mistake</option>
                    <option value="Shipping takes too long">Shipping takes too long</option>
                    <option value="Other">Other</option>
                  </select>

                  {cancelReason === "Other" && (
                    <textarea
                      placeholder="Please specify your reason"
                      className="w-full p-2 border border-gray-300 rounded-md mt-2 focus:ring-2 focus:ring-black focus:border-transparent"
                      rows={3}
                      onChange={(e) => setCancelReason(e.target.value)}
                    ></textarea>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeCancelModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={!cancelReason}
                    className={`px-4 py-2 rounded-md text-white ${
                      cancelReason ? "bg-red-600 hover:bg-red-700" : "bg-red-300 cursor-not-allowed"
                    }`}
                  >
                    Cancel Order
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default Order

