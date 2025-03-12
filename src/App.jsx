import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'; // Import Firebase Auth
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider, Navigate } from 'react-router-dom';
import './App.css';
import { CartProvider } from './Layout/CartContext';
import Home from './User-YSS/Home';
import About from './User-YSS/About';
import Shop from './User-YSS/Shop';
import NavBar from './Layout/NavbarLayout';
import Lookbook from './User-YSS/Lookbook';
import Contact from './User-YSS/Contact';
import FAQ from './User-YSS/FAQ';
import UserSignIn from './User-YSS/UserSignIn';
import AdminLogin from './Admin-YSS/AdminLogin';
import AdminDashboard from './Admin-YSS/AdminDashboard';
import AdminShop from './Admin-YSS/AdminShop';
import AdminLookbook from './Admin-YSS/AdminLookbook';
import AdminOrderManagement from './Admin-YSS/AdminOrderManagement';
import AdminNavbar from './Admin-YSS/Admin-Layout/AdminNavbar';
import UserSignup from './User-YSS/UserSignup';
import Checkout from './User-YSS/Checkout';
import Cart from './User-YSS/Cart';
import AdminQoutes from './Admin-YSS/AdminQuotes';
import Order from './User-YSS/Order';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userUID, setUserUID] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUserUID(user.uid);
      } else {
        setIsLoggedIn(false);
        setUserUID(null);
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const logInHandler = (userUID) => {
    console.log("Admin Logged in:", userUID);
    setIsLoggedIn(true);
    setUserUID(userUID);
  };

  const logOutHandler = async () => {
    try {
      await signOut(auth); // Firebase sign out
      setIsLoggedIn(false);
      setUserUID(null);
      console.log("User logged out");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* User Path */}
        <Route path="/" element={<NavBar />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="lookbook" element={<Lookbook />} />
          <Route path='cart' element={<Cart />} />
          <Route path='orders' element={<Order />} />
          <Route path="checkout" element={<Checkout/>} />
          <Route path="UserSignIn" element={<UserSignIn />} />
          <Route path="UserSignUp" element={<UserSignup />} />
        </Route>

        {/* Admin Login Route */}
        <Route path="/admin" element={<AdminLogin logInHandler={logInHandler} />} />        
        {/* Protected Admin Routes */}
        <Route path="/admindashboard" element={isLoggedIn ? <AdminNavbar logOutHandler={logOutHandler} /> : <Navigate to="/admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="adminshop" element={<AdminShop />} />
          <Route path="adminlookbook" element={<AdminLookbook />} />
          <Route path="adminordermanagement" element={<AdminOrderManagement />} />
          <Route path='adminquotes' element={<AdminQoutes />} />
        </Route>

        {/* Catch-all route for non-existent paths */}
        <Route path="*" element={<Navigate to="/" />} />
      </>
    )
  );

  return (
    <CartProvider userUID={userUID}>
      <RouterProvider router={router} />
    </CartProvider>
  );
}

export default App;
