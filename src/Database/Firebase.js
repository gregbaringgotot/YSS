import { initializeApp } from "firebase/app"
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth"
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore"
import { getDatabase } from "firebase/database"
import axios from "axios"

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAylHJpHDOhK_5uUK4J73tifBauOZwILQc",
  authDomain: "yss-final.firebaseapp.com",
  projectId: "yss-final",
  storageBucket: "yss-final.appspot.com",
  messagingSenderId: "111711921902",
  appId: "1:111711921902:web:e7b23f006ea8bfff6635ff",
  measurementId: "G-G6ZGZV101S",
  databaseURL: "https://yss-final-default-rtdb.firebaseio.com/",
}

// ✅ Initialize Firebase App
const app = initializeApp(firebaseConfig)

// ✅ Firebase Services
export const auth = getAuth(app) // Authentication Service
export const db = getFirestore(app) // Firestore Database
export const realtimeDB = getDatabase(app) // Realtime Database

// ✅ Firestore Collections
export const lookbookCollection = collection(db, "lookbook") // Lookbook Collection
export const shopCollection = collection(db, "shop") // Shop Collection
export const userCartsCollection = (uid) => collection(db, "carts", uid, "cartsuid")
export const userRef = (uid) => doc(db, "users", uid) // User data reference
export const quotesCollection = collection(db, "quotes")
export const reviewsCollection = collection(db, "reviews")

// ✅ Cloudinary Configuration
export const CLOUDINARY_CLOUD_NAME = "dm97yk6vr" // Your Cloud Name
export const CLOUDINARY_UPLOAD_PRESET_PRODUCT = "product_shop" // Upload preset for product images
export const CLOUDINARY_UPLOAD_PRESET_LOOKBOOK = "lookbook_images" // Upload preset for Lookbook images
export const CLOUDINARY_UPLOAD_PRESET_QUOTES = "quotes_images"
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload` // Cloudinary API URL

// ✅ Firestore CRUD Functions with error handling
export const addToCart = async (uid, product) => {
  if (!uid) {
    console.error("No user UID provided")
    return
  }

  try {
    const cartRef = doc(db, "carts", uid) // Reference to the user's cart document
    const cartSnap = await getDoc(cartRef)

    if (cartSnap.exists()) {
      // If the cart exists, update the items array
      const cartData = cartSnap.data()
      const existingItems = cartData.items || []
      const existingItemIndex = existingItems.findIndex((item) => item.id === product.id && item.size === product.size)

      if (existingItemIndex !== -1) {
        // If the item already exists in the cart, update the quantity
        existingItems[existingItemIndex].quantity += product.quantity
      } else {
        // If the item doesn't exist, add it to the cart
        existingItems.push(product)
      }

      await updateDoc(cartRef, { items: existingItems })
    } else {
      // If the cart doesn't exist, create a new cart with the item
      await setDoc(cartRef, { items: [product] })
    }

    console.log("Product added to cart")
  } catch (error) {
    console.error("Error adding item to cart:", error)
  }
}

export const saveUserToDatabase = async (uid, firstName, lastName, email) => {
  try {
    const userRef = doc(db, "users", uid)
    await setDoc(userRef, {
      firstName,
      lastName,
      email,
    })
    console.log("User saved to Firestore")
  } catch (error) {
    console.error("Error saving user to Firestore:", error)
  }
}

// ✅ Force Firebase to Require Login After Refresh
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Firebase auth persistence set to session-only.")
  })
  .catch((error) => {
    console.error("Error setting auth persistence:", error)
  })

// Fetch user address from Firestore
export const getUserAddress = async (userUID) => {
  try {
    const userDocRef = doc(db, "users", userUID)
    // Use getDoc with cache disabled to always get fresh data
    const userDocSnap = await getDoc(userDocRef, { source: "server" })

    if (userDocSnap.exists()) {
      console.log("Fetched user address:", userDocSnap.data())
      return userDocSnap.data()
    } else {
      console.log("No address found for user")
      return null
    }
  } catch (error) {
    console.error("Error fetching user address:", error)
    throw error
  }
}

// Only modifying the updateUserAddress function
export const updateUserAddress = async (uid, newAddress) => {
  if (!uid) {
    console.error("No user UID provided")
    return
  }

  try {
    const userDocRef = doc(db, "users", uid) // Reference to the user's document

    // Save address fields directly to the user document
    await updateDoc(userDocRef, newAddress)

    console.log("User address updated successfully!")
  } catch (error) {
    console.error("Error updating address:", error)
    throw error // Propagate the error to handle it in the component
  }
}

export const getCartItems = async (uid) => {
  if (!uid) {
    console.error("No user UID provided")
    return []
  }

  try {
    const cartRef = doc(db, "carts", uid)
    const cartSnap = await getDoc(cartRef)

    if (cartSnap.exists()) {
      return cartSnap.data().items || []
    } else {
      console.log("No cart items found")
      return []
    }
  } catch (error) {
    console.error("Error fetching cart items:", error)
    return []
  }
}

export const removeCartItem = async (uid, itemId) => {
  if (!uid) {
    console.error("No user UID provided")
    return
  }

  try {
    const cartRef = doc(db, "carts", uid)
    const cartSnap = await getDoc(cartRef)

    if (cartSnap.exists()) {
      const cartData = cartSnap.data()
      const updatedItems = cartData.items.filter((item) => item.id !== itemId)

      await updateDoc(cartRef, { items: updatedItems })
      console.log("Item removed from cart")
    }
  } catch (error) {
    console.error("Error removing item from cart:", error)
  }
}

export const onCartUpdate = (uid, callback) => {
  if (!uid) {
    console.error("No user UID provided")
    return
  }

  const cartRef = userCartsCollection(uid)
  return onSnapshot(cartRef, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(items)
  })
}

// Clear the cart for a user
export const clearCart = async (uid) => {
  if (!uid) {
    console.error("No user UID provided")
    return
  }

  try {
    const cartRef = doc(db, "carts", uid)
    await updateDoc(cartRef, { items: [] })
    console.log("Cart cleared successfully")
  } catch (error) {
    console.error("Error clearing cart:", error)
  }
}

// Fetch a shop item by ID
export const getShopItem = async (itemId) => {
  try {
    const itemRef = doc(db, "shop", itemId)
    const itemSnap = await getDoc(itemRef)
    if (itemSnap.exists()) {
      return itemSnap.data()
    } else {
      throw new Error("Item not found")
    }
  } catch (error) {
    console.error("Error fetching shop item:", error)
    return null
  }
}

// Update a shop item
export const updateShopItem = async (itemId, newData) => {
  try {
    const itemRef = doc(db, "shop", itemId)
    await updateDoc(itemRef, newData)
    console.log("Shop item updated successfully")
  } catch (error) {
    console.error("Error updating shop item:", error)
  }
}

// Save order to Firestore
export const saveOrder = async (orderData) => {
  try {
    const ordersCollection = collection(db, "orders")
    await addDoc(ordersCollection, orderData)
    console.log("Order saved successfully!")
  } catch (error) {
    console.error("Error saving order:", error)
    throw error
  }
}

export const addQuoteToFirestore = async (quoteData) => {
  try {
    await addDoc(quotesCollection, quoteData) // Add to 'quotes' collection in Firestore
    console.log("Quote added to Firestore")
  } catch (error) {
    console.error("Error adding quote to Firestore:", error)
  }
}

export const deleteQuoteFromFirestore = async (quoteId) => {
  try {
    const quoteDocRef = doc(db, "quotes", quoteId) // Reference to the quote document to delete
    await deleteDoc(quoteDocRef) // Delete the document from Firestore
    console.log("Quote deleted from Firestore")
  } catch (error) {
    console.error("Error deleting quote from Firestore:", error)
  }
}

export const getQuotesFromFirestore = async () => {
  try {
    const querySnapshot = await getDocs(quotesCollection)

    // Map over the query snapshot to get the data from each document
    const quotes = querySnapshot.docs.map((doc) => ({
      id: doc.id, // Get the document ID
      ...doc.data(), // Get the document data
    }))

    return quotes // Return the array of quotes
  } catch (error) {
    console.error("Error fetching quotes from Firestore:", error)
    return [] // Return an empty array in case of error
  }
}

export const updateQuoteInFirestore = async (quoteId, updatedQuote) => {
  try {
    const quoteDocRef = doc(db, "quotes", quoteId) // Reference to the specific quote document
    await updateDoc(quoteDocRef, updatedQuote) // Update the document in Firestore
    console.log("Quote updated in Firestore")
  } catch (error) {
    console.error("Error updating quote in Firestore:", error)
  }
}

export const uploadQuoteImageToCloudinary = async (file) => {
  try {
    const formData = new FormData() // Create FormData to hold the image and additional parameters

    formData.append("file", file) // Append the image file to FormData
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET_QUOTES) // Cloudinary upload preset (ensure it's defined correctly)

    // Send the request to Cloudinary API for image upload
    const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Set the correct content type for file uploads
      },
    })

    // If the upload is successful, return the image URL
    if (response.status === 200) {
      return response.data.secure_url // Return the secure URL of the uploaded image
    } else {
      console.error("Error uploading image to Cloudinary:", response)
      return null
    }
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error)
    return null
  }
}

// Add a review to Firestore
export const addReviewToFirestore = async (reviewData) => {
  try {
    await addDoc(reviewsCollection, reviewData)
    console.log("Review added to Firestore")
    return true
  } catch (error) {
    console.error("Error adding review to Firestore:", error)
    return false
  }
}

// Get all reviews from Firestore
export const getReviewsFromFirestore = async (limitCount = 10) => {
  try {
    const q = query(reviewsCollection, orderBy("timestamp", "desc"), limit(limitCount))

    const querySnapshot = await getDocs(q)

    const reviews = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return reviews
  } catch (error) {
    console.error("Error fetching reviews from Firestore:", error)
    return []
  }
}

// Get reviews for a specific product
export const getProductReviews = async (productId) => {
  try {
    const q = query(reviewsCollection, where("productId", "==", productId), orderBy("timestamp", "desc"))

    const querySnapshot = await getDocs(q)

    const reviews = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return reviews
  } catch (error) {
    console.error("Error fetching product reviews:", error)
    return []
  }
}

// Upload review images to Cloudinary
export const uploadReviewImages = async (files) => {
  try {
    const uploadPromises = files.map((file) => uploadQuoteImageToCloudinary(file))
    const urls = await Promise.all(uploadPromises)
    return urls.filter((url) => url !== null)
  } catch (error) {
    console.error("Error uploading review images:", error)
    return []
  }
}

export default app

