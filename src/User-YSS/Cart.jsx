import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Trash2, Minus, Plus, ChevronDown } from "lucide-react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, updateDoc, onSnapshot, collection, getDocs } from "firebase/firestore"
import { db } from "../Database/Firebase" // Adjust the import path as needed

function Cart() {
  const [cartItems, setCartItems] = useState([]) // Local state for cart items
  const [products, setProducts] = useState({}) // Store product details including stock info
  const [showSizeDropdown, setShowSizeDropdown] = useState(null) // Track which item has open dropdown
  const [loading, setLoading] = useState(true) // Loading state
  const [userUID, setUserUID] = useState(null)
  const navigate = useNavigate()
  const auth = getAuth() // Initialize Firebase Auth
  const [showSignInModal, setShowSignInModal] = useState(false)

  // 🔹 Check authentication state before fetching cart
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserUID(user.uid)
        setShowSignInModal(false) // Make sure modal is hidden when user is signed in
      } else {
        setUserUID(null)
        setShowSignInModal(true) // Show modal instead of redirecting
      }
    })

    return () => unsubscribe() // Cleanup on unmount
  }, [])

  // Fetch all products to get stock information
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = collection(db, "shop") // Assuming your shop collection name is "shop"
        const querySnapshot = await getDocs(productsRef)

        const productsData = {}
        querySnapshot.docs.forEach((doc) => {
          productsData[doc.id] = doc.data()
        })

        setProducts(productsData)
      } catch (error) {
        console.error("Error fetching products:", error)
      }
    }

    fetchProducts()
  }, [])

  // 🔹 Fetch cart items once the user is authenticated
  useEffect(() => {
    if (!userUID) return

    const fetchCartItems = async () => {
      setLoading(true)

      const cartRef = doc(db, "carts", userUID)
      const cartSnap = await getDoc(cartRef)

      if (cartSnap.exists()) {
        setCartItems(cartSnap.data().items || [])
      } else {
        setCartItems([])
      }

      setLoading(false)
    }

    fetchCartItems()

    // Real-time listener for cart updates
    const cartRef = doc(db, "carts", userUID)
    const unsubscribe = onSnapshot(cartRef, (doc) => {
      if (doc.exists()) {
        setCartItems(doc.data().items || [])
      } else {
        setCartItems([])
      }
    })

    return () => unsubscribe()
  }, [userUID])

  // Handle Remove Item
  const handleRemove = async (itemId) => {
    if (!userUID) return

    try {
      const cartRef = doc(db, "carts", userUID)
      const cartSnap = await getDoc(cartRef)

      if (cartSnap.exists()) {
        const cartData = cartSnap.data()
        const updatedItems = cartData.items.filter((item) => item.id !== itemId)

        await updateDoc(cartRef, { items: updatedItems }) // Update Firestore
        setCartItems(updatedItems) // Update local state
      }
    } catch (error) {
      console.error("Error removing item from cart:", error)
    }
  }

  // Handle Update Quantity
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (!userUID) return

    try {
      // Get the product to check stock limits
      const product = products[itemId]
      const item = cartItems.find((item) => item.id === itemId)

      if (product && item) {
        // Get available stock for the selected size
        const availableStock = product.stocks?.[item.size] || 0

        // Ensure quantity doesn't exceed available stock
        const quantity = Math.min(Math.max(1, newQuantity), availableStock)

        const cartRef = doc(db, "carts", userUID)
        const cartSnap = await getDoc(cartRef)

        if (cartSnap.exists()) {
          const cartData = cartSnap.data()
          const updatedItems = cartData.items.map((item) => (item.id === itemId ? { ...item, quantity } : item))

          await updateDoc(cartRef, { items: updatedItems }) // Update Firestore
          setCartItems(updatedItems) // Update local state
        }
      }
    } catch (error) {
      console.error("Error updating item quantity:", error)
    }
  }

  // Handle Update Size
  const handleUpdateSize = async (itemId, newSize) => {
    if (!userUID) return

    try {
      const cartRef = doc(db, "carts", userUID)
      const cartSnap = await getDoc(cartRef)

      if (cartSnap.exists()) {
        const cartData = cartSnap.data()
        const itemIndex = cartData.items.findIndex((item) => item.id === itemId)

        if (itemIndex !== -1) {
          const item = cartData.items[itemIndex]
          const product = products[itemId]

          // Get available stock for the new size
          const availableStock = product?.stocks?.[newSize] || 0

          // Adjust quantity if it exceeds available stock
          const adjustedQuantity = Math.min(item.quantity, availableStock)

          const updatedItems = [...cartData.items]
          updatedItems[itemIndex] = {
            ...item,
            size: newSize,
            quantity: adjustedQuantity,
          }

          await updateDoc(cartRef, { items: updatedItems }) // Update Firestore
          setCartItems(updatedItems) // Update local state
        }
      }

      // Close the dropdown after selection
      setShowSizeDropdown(null)
    } catch (error) {
      console.error("Error updating item size:", error)
    }
  }

  // Toggle size dropdown
  const toggleSizeDropdown = (itemId) => {
    if (showSizeDropdown === itemId) {
      setShowSizeDropdown(null)
    } else {
      setShowSizeDropdown(itemId)
    }
  }

  // Get available sizes for a product
  const getAvailableSizes = (productId) => {
    const product = products[productId]
    if (!product || !product.stocks) return []

    return Object.entries(product.stocks)
      .filter(([_, stock]) => stock > 0)
      .map(([size]) => size)
  }

  // Handle Checkout
  const handleCheckout = () => {
    if (!userUID) {
      alert("You must be logged in to proceed to checkout.")
      navigate("/login") // Redirect to login page if userUID is not available
      return
    }

    navigate("/checkout", {
      state: {
        cartItems: cartItems,
        userUID: userUID, // Pass userUID to the Checkout component
      },
    })
  }

  // Handle Continue Shopping
  const handleContinueShopping = () => {
    navigate("/shop")
  }

  // Calculate subtotal
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

  // Check if any item exceeds available stock
  const hasStockIssue = cartItems.some((item) => {
    const product = products[item.id]
    const availableStock = product?.stocks?.[item.size] || 0
    return item.quantity > availableStock
  })

  const formatPrice = (price) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Don't display the cart if loading is true or no cart items are available
  if (loading || cartItems.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg mt-10">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 font-cousine">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added any items to your cart yet.</p>
        <button
          onClick={handleContinueShopping}
          className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors"
        >
          Start Shopping
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header with back button */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mt-20 font-cousine">YOUR CART</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items List */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="hidden md:grid grid-cols-12 p-4 border-b text-sm font-medium text-gray-500">
              <div className="col-span-6">PRODUCT</div>
              <div className="col-span-2 text-center">PRICE</div>
              <div className="col-span-2 text-center">QUANTITY</div>
              <div className="col-span-2 text-center">TOTAL</div>
            </div>

            <div className="divide-y">
              {cartItems.map((item, index) => (
                <div
                  key={`${item.id}-${item.size || index}`}
                  className="grid grid-cols-1 md:grid-cols-12 p-4 gap-4 items-center"
                >
                  {/* Product Info */}
                  <div className="col-span-6 flex items-center">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="ml-4">
                      <h3 className="font-medium">{item.name}</h3>
                      {/* Size Dropdown */}
                      <div className="relative mt-1">
                        <button
                          className="flex items-center text-sm text-gray-500 border px-2 py-1 rounded hover:bg-gray-50"
                          onClick={() => toggleSizeDropdown(item.id)}
                        >
                          Size: {item.size ? item.size.toUpperCase() : "Select Size"}
                          <ChevronDown size={14} className="ml-1" />
                        </button>

                        {showSizeDropdown === item.id && (
                          <div className="absolute z-10 mt-1 w-36 bg-white border rounded-md shadow-lg">
                            {getAvailableSizes(item.id).length > 0 ? (
                              getAvailableSizes(item.id).map((size) => (
                                <button
                                  key={size}
                                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${item.size === size ? "font-bold bg-gray-50" : ""}`}
                                  onClick={() => handleUpdateSize(item.id, size)}
                                >
                                  {size.toUpperCase()}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-gray-500">No other sizes available</div>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemove(item.id)}
                        className="flex items-center text-red-500 text-sm mt-2 hover:text-red-700"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="hidden md:block col-span-2 text-center">₱{formatPrice(item.price)}</div>

                  {products[item.id]?.stocks?.[item.size] < item.quantity && (
                    <div className="col-span-12 md:col-start-7 md:col-span-6 bg-red-50 text-red-600 p-2 rounded text-sm mt-2">
                      Only {products[item.id]?.stocks?.[item.size] || 0} items in stock. Quantity has been adjusted.
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="col-span-2 flex flex-col items-center">
                    <div className="flex items-center border rounded-md">
                      <button
                        className="p-2 hover:bg-gray-100 text-gray-700 rounded-l-md"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        className="p-2 hover:bg-gray-100 text-gray-700 rounded-r-md"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={products[item.id]?.stocks?.[item.size] <= item.quantity}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {products[item.id]?.stocks?.[item.size] && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.quantity} of {products[item.id].stocks[item.size]} available
                      </p>
                    )}
                  </div>

                  {/* Total */}
                  <div className="col-span-2 text-center font-medium">₱{formatPrice(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4 font-cousine">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Subtotal ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} items)
                </span>
                <span>₱{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>Cash On Delivery</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between font-bold text-lg">
                <span>ESTIMATED TOTAL</span>
                <span>₱{formatPrice(subtotal)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={hasStockIssue}
              className={`text-white text-center w-full py-4 rounded-md uppercase tracking-wide font-bold text-sm transition-colors ${
                hasStockIssue ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
              }`}
            >
              {hasStockIssue ? "Some Items Exceed Available Stock" : "Proceed to Checkout"}
            </button>

            <button
              onClick={handleContinueShopping}
              className="text-center w-full py-3 mt-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center animate-fadeIn w-96 max-w-lg">
            <div className="mb-4 text-center">
              <h2 className="text-large font-semibold font-cousine">
                Sign in to add items to your cart and place an order
              </h2>
            </div>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-600"
                onClick={() => navigate("/UserSignIn")} // Redirect to the sign-in page
              >
                Go to Sign In
              </button>
              <button
                className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={() => setShowSignInModal(false)} // Close the modal
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart

