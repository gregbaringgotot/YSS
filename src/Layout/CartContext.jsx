import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { addToCart, getCartItems, removeCartItem, onCartUpdate } from '../Database/Firebase';
import { db } from '../Database/Firebase';
import { doc, getDoc } from 'firebase/firestore';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [userUID, setUserUID] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the cart items when the user logs in or userUID changes
  useEffect(() => {
    if (userUID) {
      const fetchCartFromFirestore = async () => {
        try {
          const items = await getCartItems(userUID);
          setCartItems(items);  // Set cart items to state
        } catch (error) {
          console.error("Error fetching cart items:", error);
          setCartItems([]);  // Fallback to empty array on error
        } finally {
          setLoading(false);
        }
      };

      fetchCartFromFirestore();
    }
  }, [userUID]);

  // Fetch user data based on userUID
  useEffect(() => {
    if (userUID) {
      const fetchUserData = async () => {
        try {
          const userRef = doc(db, "users", userUID);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserInfo(userSnap.data());
          } else {
            setUserInfo(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };

      fetchUserData();
    }
  }, [userUID]);

  // Listen for real-time cart updates from Firestore
  useEffect(() => {
    if (userUID) {
      const unsubscribe = onCartUpdate(userUID, setCartItems);
      return () => unsubscribe();
    }
  }, [userUID]);

  // Add to cart function
  const addToCartHandler = useCallback((item) => {
    if (userUID) {
      addToCart(userUID, item);
      setCartItems((prevItems) => {
        const itemIndex = prevItems.findIndex((cartItem) => cartItem.id === item.id);
        if (itemIndex !== -1) {
          const updatedItems = [...prevItems];
          updatedItems[itemIndex].quantity += item.quantity;
          return updatedItems;
        } else {
          return [...prevItems, item];
        }
      });
    } else {
      console.error("User UID is not available.");
    }
  }, [userUID]);

  // Remove from cart function
  const removeFromCartHandler = useCallback((itemId) => {
    if (userUID) {
      removeCartItem(userUID, itemId);
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } else {
      console.error("User UID is not available.");
    }
  }, [userUID]);

  // Make sure to return unique keys by ensuring item.id is unique
  const renderCartItems = () => {
    return cartItems.map((item, index) => (
      <div key={`${item.id}-${index}`}> {/* Unique key using item.id and index */}
        {/* Render cart item details */}
      </div>
    ));
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      userInfo,
      setUserUID,
      addToCartHandler,
      removeFromCartHandler,
      loading
    }}>
      {children}
    </CartContext.Provider>
  );
};
