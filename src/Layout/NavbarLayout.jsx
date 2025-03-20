"use client"

import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Footer from "./FooterLayout"
import { useCart } from "../Layout/CartContext"
import { auth } from "../Database/Firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"

import { ShoppingCart, User, Menu, X, Package, LogOut } from "lucide-react"

function NavbarLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { cartItems } = useCart()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null) // No persistence
  const [isUserHovered, setIsUserHovered] = useState(false)

  // Check if current location is /about, /contact, or /FAQ
  const isAboutActive =
    location.pathname === "/about" || location.pathname === "/contact" || location.pathname === "/FAQ"

  // 🔹 Check authentication state when the navbar loads
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  // 🔹 Handle logout (clears authentication & refreshes page)
  const handleLogout = async () => {
    try {
      await signOut(auth)
      setCurrentUser(null)
      navigate("/") // Navigate to home after logout
      window.location.reload() // Refresh page to clear auth state
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Function to handle window resize
  // 🔹 Handle window resize for mobile menu
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest(".user-menu-container")) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isUserMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-white shadow-lg z-20">
        <nav className="container mx-auto flex justify-between items-center h-18 px-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <NavLink to="/" className="flex items-center">
              <img src="src/assets/YSS LOGO PNG 2.png" alt="Logo" className="h-12 w-auto" />
            </NavLink>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `nav-link flex items-center justify-center h-16 px-4 font-cousine font-bold text-center transition-all ease-in-out duration-300 ${isActive ? "text-gray-700 border-b-2 border-gray-700" : "hover:text-gray-500 border-b-2 border-transparent hover:border-gray-700"}`
              }
            >
              HOME
            </NavLink>

            <NavLink
              to="/Shop"
              className={({ isActive }) =>
                `nav-link flex items-center justify-center h-16 px-4 font-cousine font-bold text-center transition-all ease-in-out duration-300 ${isActive ? "text-gray-700 border-b-2 border-gray-700" : "hover:text-gray-500 border-b-2 border-transparent hover:border-gray-700"}`
              }
            >
              SHOP
            </NavLink>

            {/* About Us with Dropdown */}
            <div className="relative group">
              <NavLink
                to="/about"
                className={`nav-link flex items-center justify-center h-16 px-4 font-cousine font-bold text-center transition-all ease-in-out duration-300 ${isAboutActive ? "text-gray-700 border-b-2 border-gray-700" : "hover:text-gray-500 border-b-2 border-transparent hover:border-gray-700"}`}
              >
                ABOUT US
              </NavLink>

              {/* Dropdown Menu */}
              <ul className="absolute left-0 w-40 bg-white shadow-lg rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto font-cousine bg-[#FAFAFA]">
                <li>
                  <NavLink to="/contact" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Contact Us
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/FAQ" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    FAQ
                  </NavLink>
                </li>
              </ul>
            </div>

            <NavLink
              to="/lookbook"
              className={({ isActive }) =>
                `nav-link flex items-center justify-center h-16 px-4 font-cousine font-bold text-center transition-all ease-in-out duration-300 ${isActive ? "text-gray-700 border-b-2 border-gray-700" : "hover:text-gray-500 border-b-2 border-transparent hover:border-gray-700"}`
              }
            >
              LOOKBOOK
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden flex items-center" onClick={toggleMobileMenu} aria-label="Toggle menu">
            {isMobileMenuOpen ? <X size={24} className="text-black" /> : <Menu size={24} className="text-black" />}
          </button>

          <div className="flex items-center">
            {/* Order Icon */}
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `flex items-center justify-center h-16 px-2 md:px-4 relative transition-all ease-in-out duration-300 ${isActive ? "text-gray-700 border-b-2 border-gray-700" : "hover:text-gray-500 border-b-2 border-transparent hover:border-gray-700"}`
              }
            >
              <Package size={24} className="text-black" />
            </NavLink>

            {/* Cart Icon with Hover Effect and Active Line */}
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `relative flex items-center justify-center h-16 px-2 md:px-4 ${isActive ? "text-gray-700 border-b-2 border-gray-700" : "hover:text-gray-500 border-b-2 border-transparent hover:border-gray-700"}`
              }
            >
              <ShoppingCart size={24} className="text-black" />
              {cartItems.length > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white text-xs rounded-full px-1">
                  {cartItems.length}
                </span>
              )}
            </NavLink>

            {/* User Account Button with Dropdown - IMPROVED */}
            <div className="user-menu-container relative">
              <button
                onClick={toggleUserMenu}
                onMouseEnter={() => setIsUserHovered(true)}
                onMouseLeave={() => setIsUserHovered(false)}
                className={`flex items-center justify-center h-16 px-2 md:px-4 relative transition-all ease-in-out duration-300 ${location.pathname === "/UserSignIn" || location.pathname === "/account" ? "text-gray-700 border-b-2 border-gray-700" : "hover:text-gray-500 border-b-2 border-transparent hover:border-gray-700"}`}
                aria-label={currentUser ? "User account menu" : "Sign in"}
              >
                <User size={24} className="text-black" />

                {/* Improved status indicator dot with animation on hover */}
                {currentUser && (
                  <span
                    className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${isUserHovered ? "bg-green-500 animate-pulse" : "bg-green-500"}`}
                  ></span>
                )}

                {/* Login status tooltip on hover */}
                {isUserHovered && (
                  <div className="absolute top-full mt-1 right-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
                    {currentUser ? `Logged in as ${currentUser.displayName || currentUser.email}` : "Click to sign in"}
                  </div>
                )}
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white shadow-lg rounded-md z-50 overflow-hidden">
                  {currentUser ? (
                    <>
                      <div className="p-3 bg-gray-50 border-b border-gray-200">
                        <p className="font-medium text-gray-800">{currentUser.displayName || "User"}</p>
                        <p className="text-sm text-gray-500 truncate">{currentUser.email}</p>
                      </div>
                      <NavLink to="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        My Orders
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut size={16} className="mr-2" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <NavLink
                        to="/UserSignIn"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 font-cousine"
                      >
                        SIGN IN
                      </NavLink>
                      <NavLink
                        to="/UserSignUp"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 font-cousine"
                      >
                        CREATE ACCOUNT
                      </NavLink>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white shadow-lg absolute w-full z-30">
            <div className="flex flex-col py-2">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-6 py-3 font-cousine font-bold ${isActive ? "text-gray-700 bg-gray-100" : "text-gray-700"}`
                }
                onClick={closeMobileMenu}
              >
                HOME
              </NavLink>
              <NavLink
                to="/Shop"
                className={({ isActive }) =>
                  `px-6 py-3 font-cousine font-bold ${isActive ? "text-gray-700 bg-gray-100" : "text-gray-700"}`
                }
                onClick={closeMobileMenu}
              >
                SHOP
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `px-6 py-3 font-cousine font-bold ${isAboutActive ? "text-gray-700 bg-gray-100" : "text-gray-700"}`
                }
                onClick={closeMobileMenu}
              >
                ABOUT US
              </NavLink>
              <div className="pl-6 bg-gray-50">
                <NavLink
                  to="/contact"
                  className={({ isActive }) => `block px-6 py-2 text-gray-600 ${isActive ? "font-semibold" : ""}`}
                  onClick={closeMobileMenu}
                >
                  Contact Us
                </NavLink>
                <NavLink
                  to="/FAQ"
                  className={({ isActive }) => `block px-6 py-2 text-gray-600 ${isActive ? "font-semibold" : ""}`}
                  onClick={closeMobileMenu}
                >
                  FAQ
                </NavLink>
              </div>
              <NavLink
                to="/lookbook"
                className={({ isActive }) =>
                  `px-6 py-3 font-cousine font-bold ${isActive ? "text-gray-700 bg-gray-100" : "text-gray-700"}`
                }
                onClick={closeMobileMenu}
              >
                LOOKBOOK
              </NavLink>
              {/* Mobile user account section */}
              {currentUser ? (
                <>
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="font-medium text-gray-800">{currentUser.name}</p>
                    <p className="text-sm text-gray-500">{currentUser.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout()
                      closeMobileMenu()
                    }}
                    className="flex items-center px-6 py-2 text-gray-600 w-full text-left"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/UserSignIn"
                    className={({ isActive }) =>
                      `px-6 py-3 font-cousine font-bold ${isActive ? "text-gray-700 bg-gray-100 border-b-2 border-gray-700" : "text-gray-700"}`
                    }
                    onClick={closeMobileMenu}
                  >
                    SIGN IN
                  </NavLink>
                  <NavLink
                    to="/UserSignUp"
                    className={({ isActive }) =>
                      `px-6 py-3 font-cousine ${isActive ? "text-gray-700 bg-gray-100 border-b-2 border-gray-700" : "text-gray-700"}`
                    }
                    onClick={closeMobileMenu}
                  >
                    CREATE ACCOUNT
                  </NavLink>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Content with padding for fixed header */}
      <div className="flex-grow">
        <Outlet />
      </div>

      <Footer />
    </>
  )
}

export default NavbarLayout

