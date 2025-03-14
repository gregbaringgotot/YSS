import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { auth, db } from "../Database/Firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import backgroundImage from "../assets/SignUp-Images/SignUp.png";

function UserSignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!", {
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
      return;
    }
  
    try {
      // Step 1: Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Step 2: Save user data to Firestore
      const userRef = doc(collection(db, "users"), user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        firstName,
        lastName,
        email,
        createdAt: new Date(),
      });
  
      toast.success("Account Created Successfully!", {
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
      
    } catch (error) {
      toast.error(error.message, {
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
    <div className="flex min-h-screen bg-gray-100">
      <ToastContainer />
      {/* Left side - Image */}
      <div className="hidden md:block md:w-1/2 h-screen">
        <img src={backgroundImage} alt="Background" className="w-full h-full object-cover" />
      </div>
      
      {/* Right side - Form */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-4 pt-16 md:pt-4 mt-20">
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center mb-5">
            <h2 className="text-2xl font-bold text-gray-800 font-cousine">Sign Up</h2>
          </div>

          <form onSubmit={handleSignUp} className="flex flex-col">
            <div className="flex flex-col sm:flex-row sm:space-x-4 mb-3">
              <div className="w-full sm:w-1/2 text-left mb-3 sm:mb-0">
                <label className="text-gray-700 text-xs font-semibold mb-1 block font-cousine">First Name</label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 font-poppins text-sm"
                  required
                />
              </div>
              <div className="w-full sm:w-1/2 text-left">
                <label className="text-gray-700 text-xs font-semibold mb-1 block font-cousine">Last Name</label>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 font-poppins text-sm"
                  required
                />
              </div>
            </div>

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
            <div className="mb-3 text-left">
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

            {/* Confirm Password Input */}
            <div className="mb-4 text-left">
              <label className="text-gray-700 text-xs font-semibold mb-1 block font-cousine">Confirm Password</label>
              <div className="relative w-full">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 pr-10 text-sm"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full p-2 bg-black text-white font-medium rounded-lg transition duration-300 hover:bg-white hover:text-black border border-black font-cousine text-sm">
              Sign Up
            </button>

            <p className="text-xs mt-4 text-center font-cousine">
              Already have an account? <a href="UserSignin" className="text-gray-800 font-semibold hover:underline">Sign In</a>
            </p>
          </form>
        </div>
      </div>
      
      {/* Mobile view image (only shows on small screens) */}
      <div className="block md:hidden fixed bottom-0 left-0 right-0 h-32 z-0">
        <img src={backgroundImage} alt="Background" className="w-full h-full object-cover opacity-30" />
      </div>
    </div>
  );
}

export default UserSignUp;