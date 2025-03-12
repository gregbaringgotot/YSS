import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Minus, Plus, ChevronDown } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { db } from "../Database/Firebase"; // Adjust the import path as needed

function Cart() {
  const [cartItems, setCartItems] = useState([]); // Local state for cart items
  const [products, setProducts] = useState({}); // Store product details including stock info
  const [showSizeDropdown, setShowSizeDropdown] = useState(null); // Track which item has open dropdown
  const [loading, setLoading] = useState(true); // Loading state
  const [userUID, setUserUID] = useState(null); 
  const navigate = useNavigate();
  const auth = getAuth(); // Initialize Firebase Auth

  // 🔹 Check authentication state before fetching cart
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserUID(user.uid);
      } else {
        setUserUID(null);
        navigate("/UserSignIn"); // Redirect to login if not authenticated
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [navigate]);

  // Fetch all products to get stock information
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = collection(db, "shop"); // Assuming your shop collection name is "shop"
        const querySnapshot = await getDocs(productsRef);
        
        const productsData = {};
        querySnapshot.docs.forEach((doc) => {
          productsData[doc.id] = doc.data();
        });
        
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // 🔹 Fetch cart items once the user is authenticated
  useEffect(() => {
    if (!userUID) return;

    const fetchCartItems = async () => {
      setLoading(true);

      const cartRef = doc(db, "carts", userUID);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        setCartItems(cartSnap.data().items || []);
      } else {
        setCartItems([]);
      }

      setLoading(false);
    };

    fetchCartItems();

    // Real-time listener for cart updates
    const cartRef = doc(db, "carts", userUID);
    const unsubscribe = onSnapshot(cartRef, (doc) => {
      if (doc.exists()) {
        setCartItems(doc.data().items || []);
      } else {
        setCartItems([]);
      }
    });

    return () => unsubscribe();
  }, [userUID]);

  // 🔹 Prevent users from accessing the cart if they are not authenticated
  if (userUID === null) {
    return <div className="text-center py-16 bg-gray-50 rounded-lg">Redirecting to sign in...</div>;
  }
  // Handle Remove Item
  const handleRemove = async (itemId) => {
    if (!userUID) return;

    try {
      const cartRef = doc(db, "carts", userUID);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        const cartData = cartSnap.data();
        const updatedItems = cartData.items.filter((item) => item.id !== itemId);

        await updateDoc(cartRef, { items: updatedItems }); // Update Firestore
        setCartItems(updatedItems); // Update local state
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
    }
  };

  // Handle Update Quantity
  const handleUpdateQuantity = async (itemId, quantity) => {
    if (!userUID) return;

    try {
      const cartRef = doc(db, "carts", userUID);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        const cartData = cartSnap.data();
        const updatedItems = cartData.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );

        await updateDoc(cartRef, { items: updatedItems }); // Update Firestore
        setCartItems(updatedItems); // Update local state
      }
    } catch (error) {
      console.error("Error updating item quantity:", error);
    }
  };

  // Handle Update Size
  const handleUpdateSize = async (itemId, newSize) => {
    if (!userUID) return;

    try {
      const cartRef = doc(db, "carts", userUID);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        const cartData = cartSnap.data();
        const updatedItems = cartData.items.map((item) =>
          item.id === itemId ? { ...item, size: newSize } : item
        );

        await updateDoc(cartRef, { items: updatedItems }); // Update Firestore
        setCartItems(updatedItems); // Update local state
      }
      
      // Close the dropdown after selection
      setShowSizeDropdown(null);
    } catch (error) {
      console.error("Error updating item size:", error);
    }
  };

  // Toggle size dropdown
  const toggleSizeDropdown = (itemId) => {
    if (showSizeDropdown === itemId) {
      setShowSizeDropdown(null);
    } else {
      setShowSizeDropdown(itemId);
    }
  };

  // Get available sizes for a product
  const getAvailableSizes = (productId) => {
    const product = products[productId];
    if (!product || !product.stocks) return [];
    
    return Object.entries(product.stocks)
      .filter(([_, stock]) => stock > 0)
      .map(([size]) => size);
  };

  // Handle Checkout
  const handleCheckout = () => {
    if (!userUID) {
      alert('You must be logged in to proceed to checkout.');
      navigate('/login'); // Redirect to login page if userUID is not available
      return;
    }

    navigate('/checkout', {
      state: {
        cartItems: cartItems,
        userUID: userUID, // Pass userUID to the Checkout component
      },
    });
  };

  // Handle Continue Shopping
  const handleContinueShopping = () => {
    navigate('/shop');
  };

  // Calculate subtotal
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Don't display the cart if loading is true or no cart items are available
  if (loading || cartItems.length === 0) {
    return <div className="text-center py-16 bg-gray-50 rounded-lg">Loading or No items in cart...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={handleContinueShopping}
          className="flex items-center text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          <span>Continue Shopping</span>
        </button>
        <h1 className="text-2xl font-bold mt-10 font-cousine">YOUR CART</h1>
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
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                    <div className="ml-4">
                      <h3 className="font-medium">{item.name}</h3>
                      {/* Size Dropdown */}
                      <div className="relative mt-1">
                        <button 
                          className="flex items-center text-sm text-gray-500 border px-2 py-1 rounded hover:bg-gray-50"
                          onClick={() => toggleSizeDropdown(item.id)}
                        >
                          Size: {item.size ? item.size.toUpperCase() : 'Select Size'}
                          <ChevronDown size={14} className="ml-1" />
                        </button>
                        
                        {showSizeDropdown === item.id && (
                          <div className="absolute z-10 mt-1 w-36 bg-white border rounded-md shadow-lg">
                            {getAvailableSizes(item.id).length > 0 ? (
                              getAvailableSizes(item.id).map((size) => (
                                <button 
                                  key={size} 
                                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${item.size === size ? 'font-bold bg-gray-50' : ''}`}
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
                  <div className="hidden md:block col-span-2 text-center">
                    ₱{item.price.toFixed(2)}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2 flex justify-center">
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
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="col-span-2 text-center font-medium">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </div>
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
                <span className="text-gray-600">Subtotal ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>Cash On Delivery</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between font-bold text-lg">
                <span>ESTIMATED TOTAL</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="bg-black text-white text-center w-full py-4 rounded-md uppercase tracking-wide font-bold text-sm hover:bg-gray-800 transition-colors"
            >
              Proceed to Checkout
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
    </div>
  );
}

export default Cart;
