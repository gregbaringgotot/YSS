import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../Database/Firebase"; // Firebase Authentication
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import backgroundImage from "../assets/SignIn-Images/SignIn.png";
import { useCart } from "../Layout/CartContext"; // Ensure correct path

function UserSignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUserUID } = useCart(); // Set user UID in context

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Handle sign-in
  const handleSignIn = async (e) => {
    e.preventDefault();
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userUID = user.uid;
  
      // Set user UID in context
      setUserUID(userUID);
  
      toast.success("Sign In Successful!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        style: { backgroundColor: "#111", color: "#fff" },
      });
      
      navigate("/", { replace: true });
  
      // Redirect after sign-in
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error(error); // Debugging
      let errorMessage;
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "User not found! Please check your email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password! Please try again.";
          break;
        default:
          errorMessage = "An error occurred during sign-in.";
      }
  
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        icon: "❌",
        style: { backgroundColor: "#111", color: "#fff" },
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 md:flex-row flex-col-reverse">
      <ToastContainer />

      {/* Left Side - Sign In Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg mt-10">
          {/* Sign In Header */}
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-gray-800 font-cousine">Sign In</h2>
          </div>

          {/* Sign In Form */}
          <form className="flex flex-col" onSubmit={handleSignIn}>
            {/* Email Input */}
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-semibold mb-2 block font-cousine" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 font-poppins"
                required
              />
            </div>

            {/* Password Input */}
            <div className="mb-4 relative">
              <label className="text-gray-700 text-sm font-semibold mb-2 block font-cousine" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right mb-6">
              <a href="/forgot-password" className="text-gray-500 text-sm font-semibold hover:underline">
                Forgot Password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full p-3 bg-black text-white font-medium rounded-lg transition duration-300 hover:bg-white hover:text-black border border-black font-cousine"
            >
              Sign In
            </button>

            {/* Sign Up Link */}
            <p className="text-sm mt-6 font-cousine text-center">
              Don't have an account?{" "}
              <a href="UserSignup" className="text-gray-500 font-semibold hover:underline">
                Sign Up
              </a>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Full Width Image (Hidden on Small Screens) */}
      <div className="w-full md:w-1/2 h-64 md:h-screen">
        <img src={backgroundImage} alt="Background" className="w-full h-full object-cover hidden md:block" />
      </div>
    </div>
  );
}

export default UserSignIn;
