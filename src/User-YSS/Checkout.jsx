
import { useState, useEffect } from "react"
import { Truck, Edit, X, Save, ShoppingCart, Minus, Plus, BanknoteIcon, AlertCircle, CheckCircle2 } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  updateUserAddress,
  getUserAddress,
  getShopItem,
  updateShopItem,
  clearCart,
  saveOrder,
} from "../Database/Firebase"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../Database/Firebase"

function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { cartItems, userUID } = location.state || { cartItems: [], userUID: "" }

  // Get today's date in the correct format (yyyy-mm-dd)
  const getTodayDate = () => {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, "0")
    const mm = String(today.getMonth() + 1).padStart(2, "0") // January is 0!
    const yyyy = today.getFullYear()
    return `${yyyy}-${mm}-${dd}`
  }

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    deliveryDate: getTodayDate(),
  })
  const [isEditing, setIsEditing] = useState(false)
  const [newAddress, setNewAddress] = useState(address)
  const [cartItemsState, setCartItems] = useState(cartItems)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [products, setProducts] = useState({}) // Store product details including stock info
  const [addressSaved, setAddressSaved] = useState(false)
  const [isAddressLoading, setIsAddressLoading] = useState(true)
  // Terms and conditions state
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Fetch user address when the component mounts or when location changes
  useEffect(() => {
    if (userUID) {
      fetchUserAddress()
    }
  }, [userUID, location.key]) // Add location.key to re-fetch when navigating back

  // Fetch products stock information
  useEffect(() => {
    fetchProductsStock()
  }, [])

  // Fetch all products to get stock information
  const fetchProductsStock = async () => {
    try {
      const productsRef = collection(db, "shop")
      const querySnapshot = await getDocs(productsRef)

      const productsData = {}
      querySnapshot.docs.forEach((doc) => {
        productsData[doc.id] = doc.data()
      })

      setProducts(productsData)

      // Check if any cart items exceed available stock
      validateCartStock(productsData)
    } catch (error) {
      console.error("Error fetching products:", error)
      setError("Failed to fetch product information. Please try again.")
    }
  }

  // Validate cart items against available stock
  const validateCartStock = (productsData) => {
    const updatedCart = [...cartItemsState]
    let hasStockIssue = false

    updatedCart.forEach((item, index) => {
      const product = productsData[item.id]
      if (product && product.stocks) {
        const availableStock = product.stocks[item.size] || 0

        if (item.quantity > availableStock) {
          updatedCart[index] = {
            ...item,
            quantity: Math.max(1, availableStock),
            hasStockIssue: true,
          }
          hasStockIssue = true
        }
      }
    })

    if (hasStockIssue) {
      setCartItems(updatedCart)
      setError("Some items in your cart exceed available stock and have been adjusted.")
    }
  }

  // Fetch user address from Firestore
  const fetchUserAddress = async () => {
    if (!userUID) {
      setError("You must be logged in to place an order.")
      navigate("/login")
      return
    }

    setIsAddressLoading(true)

    try {
      const userProfile = await getUserAddress(userUID)
      console.log("Fetched user profile:", userProfile)

      if (!userProfile) {
        setError("No user data found. Please enter your details.")
        setIsAddressLoading(false)
        return
      }

      // Check if the address is stored directly in the user document or in an address field
      const userAddress = userProfile.address || userProfile

      const populatedAddress = {
        name: userAddress.name || "",
        phone: userAddress.phone || "",
        email: userAddress.email || "",
        street: userAddress.street || "",
        city: userAddress.city || "",
        deliveryDate: userAddress.deliveryDate || getTodayDate(),
      }

      console.log("Populated Address:", populatedAddress)

      setAddress(populatedAddress)
      setNewAddress(populatedAddress)

      // Check if we have a complete address
      const hasCompleteAddress =
        populatedAddress.name &&
        populatedAddress.phone &&
        populatedAddress.email &&
        populatedAddress.street &&
        populatedAddress.city

      setAddressSaved(hasCompleteAddress)
    } catch (error) {
      console.error("Error fetching user address:", error)
      setError("Failed to fetch address. Please try again.")
    } finally {
      setIsAddressLoading(false)
    }
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setNewAddress({ ...address })
  }

  const handleSaveClick = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.email || !newAddress.street || !newAddress.city) {
      setError("All fields are required.")
      return
    }

    try {
      // Save the address directly to the user document
      await updateUserAddress(userUID, {
        name: newAddress.name,
        phone: newAddress.phone,
        email: newAddress.email,
        street: newAddress.street,
        city: newAddress.city,
        deliveryDate: newAddress.deliveryDate || getTodayDate(),
      })

      // Update local state with the new address
      setAddress({ ...newAddress })
      setIsEditing(false)
      setError("")
      setAddressSaved(true)
      setSuccessMessage("Address saved successfully!")

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
    } catch (error) {
      console.error("Error updating user address:", error)
      setError("Failed to update address. Please try again.")
    }
  }

  const handleClose = () => {
    setIsEditing(false)
    setError("")
  }

  const incrementQuantity = (itemId) => {
    const updatedCart = cartItemsState.map((item) => {
      if (item.id === itemId) {
        const product = products[item.id]
        const availableStock = product?.stocks?.[item.size] || 0

        // Only increment if we haven't reached the stock limit
        if (item.quantity < availableStock) {
          return { ...item, quantity: item.quantity + 1 }
        } else {
          // Set a flag to show stock limit message
          return { ...item, hasStockIssue: true }
        }
      }
      return item
    })

    setCartItems(updatedCart)
  }

  const decrementQuantity = (itemId) => {
    const updatedCart = cartItemsState.map((item) =>
      item.id === itemId && item.quantity > 1 ? { ...item, quantity: item.quantity - 1, hasStockIssue: false } : item,
    )
    setCartItems(updatedCart)
  }

  const subtotal = cartItemsState.reduce((acc, item) => acc + item.price * item.quantity, 0)

  // Check if any item exceeds available stock
  const hasStockIssue = cartItemsState.some((item) => {
    const product = products[item.id]
    const availableStock = product?.stocks?.[item.size] || 0
    return item.quantity > availableStock
  })

  const handleCheckout = async () => {
    if (!userUID) {
      setError("You must be logged in to place an order.")
      navigate("/login")
      return
    }

    console.log("Checking address before checkout:", address)

    if (!address.name || !address.phone || !address.email || !address.street || !address.city) {
      setError("Please fill out your shipping details before placing an order.")
      return
    }

    if (cartItemsState.length === 0) {
      setError("Your cart is empty.")
      return
    }

    // Check stock availability one more time before proceeding
    if (hasStockIssue) {
      setError("Some items exceed available stock. Please adjust quantities before proceeding.")
      return
    }

    // Check if terms have been accepted
    if (!termsAccepted) {
      setShowTermsModal(true)
      return
    }

    setIsLoading(true)
    setError("")
    setSuccessMessage("")

    try {
      for (const cartItem of cartItemsState) {
        const shopItem = await getShopItem(cartItem.id)
        if (shopItem) {
          const updatedStocks = { ...shopItem.stocks }
          if (updatedStocks[cartItem.size] < cartItem.quantity) {
            throw new Error(`Not enough stock for ${cartItem.name} (Size: ${cartItem.size}).`)
          }
          updatedStocks[cartItem.size] -= cartItem.quantity
          await updateShopItem(cartItem.id, { stocks: updatedStocks })
        }
      }

      const orderData = {
        userUID,
        items: cartItemsState,
        address,
        subtotal,
        status: "Placed",
        timestamp: new Date().toISOString(),
        termsAccepted: true,
      }

      console.log("Final order data:", orderData)

      await saveOrder(orderData)
      await clearCart(userUID)

      setSuccessMessage("Order placed successfully!")
      setTimeout(() => {
        navigate("/orders", { state: { cartItems: cartItemsState, address } })
      }, 2000)
    } catch (error) {
      console.error("Error during checkout:", error)
      setError(error.message || "An error occurred during checkout. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Format date as "Month day, year" (e.g., February 20, 2025)
  const formatDeliveryDate = (date) => {
    if (!date) return "Not specified"
    try {
      const options = { year: "numeric", month: "long", day: "numeric" }
      return new Date(date).toLocaleDateString(undefined, options)
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  // Get available stock for an item
  const getAvailableStock = (item) => {
    const product = products[item.id]
    return product?.stocks?.[item.size] || 0
  }

  const formatPrice = (price) => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Handle terms acceptance
  const handleAcceptTerms = () => {
    setTermsAccepted(true)
    setShowTermsModal(false)
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 mt-10">
      <div className="container mx-auto px-4 max-w-6xl mt-8">
        <h1 className="text-2xl font-bold mb-4 font-cousine">CHECKOUT</h1>

        {/* Error Message */}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg flex items-center">
                  <Truck className="mr-2 text-gray-600" size={20} /> SHIPPING ADDRESS
                </h2>
                <button
                  onClick={handleEditClick}
                  className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition duration-150"
                >
                  <Edit className="mr-1" size={16} /> EDIT
                </button>
              </div>
              <div className="border-t pt-4">
                {isAddressLoading ? (
                  <p className="text-gray-500">Loading address information...</p>
                ) : addressSaved ? (
                  <>
                    <p className="font-semibold text-lg">{address.name}</p>
                    <p className="text-gray-700">{address.phone}</p>
                    <p className="text-gray-700">{address.email}</p>
                    <p className="text-gray-700">{address.street}</p>
                    <p className="text-gray-700">{address.city}</p>
                    <p className="text-gray-700">Date: {formatDeliveryDate(address.deliveryDate)}</p>
                  </>
                ) : (
                  <p className="text-gray-500 italic">
                    No address saved. Please click Edit to add your shipping details.
                  </p>
                )}
              </div>
            </div>

            {/* Order Details Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center">
                <ShoppingCart className="mr-2 text-gray-600" size={20} /> ORDER DETAILS
              </h2>
              <div className="border-t pt-4">
                {cartItemsState.map((item) => (
                  <div key={item.id} className="flex flex-col mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-20 w-20 bg-gray-200 rounded-md mr-4 flex items-center justify-center">
                          <img
                            src={item.image || item.imageUrl}
                            alt={item.name}
                            className="object-cover h-full w-full rounded-md"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">Size: {item.size?.toUpperCase() || "Default"}</p>
                          <p className="text-lg font-semibold">₱{formatPrice(item.price)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center border rounded-md">
                          <button
                            onClick={() => decrementQuantity(item.id)}
                            className="px-3 py-1 text-gray-500 hover:bg-gray-100"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-4 py-1 font-medium">{item.quantity}</span>
                          <button
                            onClick={() => incrementQuantity(item.id)}
                            className="px-3 py-1 text-gray-500 hover:bg-gray-100"
                            disabled={item.quantity >= getAvailableStock(item)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.quantity} of {getAvailableStock(item)} available
                        </p>
                      </div>
                    </div>

                    {/* Stock warning */}
                    {item.hasStockIssue && (
                      <div className="mt-2 bg-red-50 text-red-600 p-2 rounded text-sm flex items-center">
                        <AlertCircle size={16} className="mr-2" />
                        Only {getAvailableStock(item)} items in stock for this size.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center">
                <BanknoteIcon className="mr-2 text-gray-600" size={20} /> PAYMENT METHOD
              </h2>
              <div className="border-t pt-4">
                <div className="flex items-center p-3 bg-gray-50 rounded-md border-2 border-black">
                  <div className="h-5 w-5 rounded-full bg-black mr-3 flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                  </div>
                  <div className="flex items-center">
                    <BanknoteIcon className="mr-2 text-black" size={18} />
                    <span className="font-medium">CASH ON DELIVERY</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center">
                <AlertCircle className="mr-2 text-gray-600" size={20} /> TERMS & CONDITIONS
              </h2>
              <div className="border-t pt-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      onClick={() => setTermsAccepted(!termsAccepted)}
                      className={`w-5 h-5 border rounded cursor-pointer flex items-center justify-center ${termsAccepted ? "bg-black border-black" : "border-gray-400"}`}
                    >
                      {termsAccepted && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-black underline font-medium"
                      >
                        Terms and Conditions
                      </button>{" "}
                      of this purchase, including the no-refund policy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-bold text-lg mb-4">ORDER SUMMARY</h2>
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <p className="text-gray-600">RETAIL PRICE:</p>
                  <p>₱{formatPrice(cartItemsState.reduce((acc, item) => acc + item.price * item.quantity, 0))}</p>
                </div>
                <div className="flex justify-between font-medium">
                  <p>
                    SUBTOTAL ({cartItemsState.length} ITEM{cartItemsState.length > 1 ? "S" : ""}):
                  </p>
                  <p>₱{formatPrice(subtotal)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">COD FEE:</p>
                  <p className="text-green-600 font-medium">FREE</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">SHIPPING FEE:</p>
                  <p className="text-green-600 font-medium">FREE</p>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <p>ORDER TOTAL:</p>
                    <p>₱{formatPrice(subtotal)}</p>
                  </div>
                </div>

                {hasStockIssue && (
                  <div className="bg-red-50 text-red-600 p-3 rounded text-sm flex items-center mt-3">
                    <AlertCircle size={16} className="mr-2" />
                    Some items exceed available stock. Please adjust quantities.
                  </div>
                )}

                {!termsAccepted && (
                  <div className="bg-amber-50 text-amber-600 p-3 rounded text-sm flex items-center mt-3">
                    <AlertCircle size={16} className="mr-2" />
                    Please accept the terms and conditions to proceed.
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={isLoading || hasStockIssue || !addressSaved || isAddressLoading || !termsAccepted}
                  className={`w-full font-medium py-3 rounded-md mt-4 transition duration-150 flex items-center justify-center ${
                    isLoading || hasStockIssue || !addressSaved || isAddressLoading || !termsAccepted
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-black hover:bg-gray-800 text-white"
                  }`}
                >
                  {isLoading
                    ? "Placing Order..."
                    : isAddressLoading
                      ? "Loading Address..."
                      : hasStockIssue
                        ? "Adjust Quantities First"
                        : !addressSaved
                          ? "Add Shipping Address First"
                          : !termsAccepted
                            ? "Accept Terms to Continue"
                            : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Editing Address */}
      {isEditing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">EDIT ADDRESS</h3>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  className="border rounded-md w-full p-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                  placeholder="Full Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="border rounded-md w-full p-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                  placeholder="Phone Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newAddress.email}
                  onChange={(e) => setNewAddress({ ...newAddress, email: e.target.value })}
                  className="border rounded-md w-full p-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                  placeholder="Email Address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="border rounded-md w-full p-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                  placeholder="Street Address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="border rounded-md w-full p-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                  placeholder="City, Country Postal Code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={newAddress.deliveryDate || getTodayDate()}
                  onChange={(e) => setNewAddress({ ...newAddress, deliveryDate: e.target.value })}
                  min={getTodayDate()}
                  className="border rounded-md w-full p-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClick}
                className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition duration-150"
              >
                <Save className="mr-2" size={18} /> Save Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl">Terms and Conditions</h3>
              <button onClick={() => setShowTermsModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="border-t pt-4 space-y-4 text-sm">
              <h4 className="font-bold text-lg">No Refund Policy</h4>
              <p>
                By placing an order with us, you acknowledge and agree that all sales are final. We do not offer refunds
                for any reason once an order has been placed and processed.
              </p>

              <h4 className="font-bold">Order Cancellation</h4>
              <p>
                Orders cannot be cancelled once they have been confirmed and payment has been processed. Please ensure
                that all details of your order are correct before proceeding with checkout.
              </p>

              <h4 className="font-bold">Product Information</h4>
              <p>
                We strive to display our products as accurately as possible. However, colors may appear differently on
                different screens. By accepting these terms, you acknowledge that minor variations in appearance are not
                grounds for return or refund.
              </p>

              <h4 className="font-bold">Delivery</h4>
              <p>
                Delivery times are estimates only. We are not responsible for delays caused by shipping carriers or
                circumstances beyond our control. By accepting these terms, you agree that delivery delays are not
                grounds for order cancellation or refund.
              </p>

              <h4 className="font-bold">Damaged Items</h4>
              <p>
                In the rare event that an item arrives damaged, you must notify us within 24 hours of receipt with clear
                photographic evidence. We may, at our sole discretion, offer a replacement if stock is available. No
                monetary refunds will be provided.
              </p>

              <h4 className="font-bold">Privacy Policy</h4>
              <p>
                By placing an order, you consent to our collection and use of your personal information as outlined in
                our Privacy Policy. We will never sell your information to third parties.
              </p>

              <div className="border-t pt-4 mt-4">
                <p className="font-bold text-red-600">By accepting these terms, you acknowledge that:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>All sales are final and non-refundable</li>
                  <li>You have reviewed your order details carefully</li>
                  <li>You understand our delivery and damage policies</li>
                  <li>You consent to our privacy practices</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-150"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptTerms}
                className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition duration-150"
              >
                <CheckCircle2 className="mr-2" size={18} /> Accept Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Checkout

