
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { auth } from "../Database/Firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useNavigate, Link } from "react-router-dom"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import backgroundImage from "../assets/SignIn-Images/SignIn.png" // Assuming you use the same background

function UserSignIn() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignIn = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Sign in with Firebase Authentication
      await signInWithEmailAndPassword(auth, email, password)

      // Show success toast and navigate ONLY after toast is closed
      toast.success("Login Successful!", {
        position: "top-right",
        autoClose: 2000, // Increased to 2 seconds to be more visible
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        style: { backgroundColor: "#111", color: "#fff" },
        onClose: () => {
          // This will execute after the toast is closed
          console.log("Toast closed, navigating to homepage...")
          setTimeout(() => {
            window.location.href = "/"
          }, 100)
        },
      })
    } catch (error) {
      // Show error toast
      toast.error(error.message, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        icon: "❌",
        style: { backgroundColor: "#111", color: "#fff" },
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ToastContainer />

      {/* Left side - Form (swapped position) */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-4 pt-16 md:pt-4 mt-20">
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center mb-5">
            <h2 className="text-2xl font-bold text-gray-800 font-cousine">Sign In</h2>
          </div>

          <form onSubmit={handleSignIn} className="flex flex-col">
            <div className="mb-3 text-left">
              <label className="text-gray-700 text-xs font-semibold mb-1 block font-cousine">Email</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 font-poppins text-sm"
                required
              />
            </div>

            {/* Password Input */}
            <div className="mb-4 text-left">
              <label className="text-gray-700 text-xs font-semibold mb-1 block font-cousine">Password</label>
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 pr-10 text-sm"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full p-2 bg-black text-white font-medium rounded-lg transition duration-300 hover:bg-white hover:text-black border border-black font-cousine text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>

            <div className="flex justify-between items-center mt-4">
              <p className="text-xs font-cousine">
                <a href="#" className="text-gray-800 hover:underline">
                  Forgot Password?
                </a>
              </p>
              <p className="text-xs font-cousine">
                Don't have an account?{" "}
                <Link to="/UserSignUp" className="text-gray-800 font-semibold hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Image (swapped position) */}
      <div className="hidden md:block md:w-1/2 h-screen">
        <img src={backgroundImage || "/placeholder.svg"} alt="Background" className="w-full h-full object-cover" />
      </div>

      {/* Mobile view image (only shows on small screens) */}
      <div className="block md:hidden fixed bottom-0 left-0 right-0 h-32 z-0">
        <img
          src={backgroundImage || "/placeholder.svg"}
          alt="Background"
          className="w-full h-full object-cover opacity-30"
        />
      </div>
    </div>
  )
}

export default UserSignIn

