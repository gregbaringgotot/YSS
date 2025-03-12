import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"; 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import toastify styles
import { Eye, EyeOff } from "lucide-react"; // Import Eye icons from lucide-react

const AdminLogin = ({ logInHandler }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const auth = getAuth();

    try {
      // Attempt to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Show success toast if login is successful
      toast.success("Successfully Logged In!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        style: { backgroundColor: "#111", color: "#fff" },
      });

      // Set the UID of the logged-in user
      const userUID = user.uid;
      logInHandler(userUID); // Store UID in your context or state

      // Navigate after 2 seconds
      setTimeout(() => {
        navigate("/Admindashboard");
      }, 2000);

    } catch (err) {
      console.error("Error code:", err.code);  // Log the error code
      console.error("Error message:", err.message);  // Log the error message

      // Show error toast
      toast.error("Invalid email or password. Please try again.", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        style: { backgroundColor: "#111", color: "#fff" },
      });
    } finally {
      setLoading(false); // Disable loading state after the process is complete
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      <ToastContainer /> {/* Toast container for notifications */}

      {/* Left Side with Logo */}
      <div className="w-1/2 flex justify-center items-center bg-white">
        <img src="src/assets/Logo.png" alt="YSS Logo" className="h-50 w-auto" />
      </div>

      {/* Divider */}
      <div className="relative flex justify-center items-center">
        <div className="h-5/6 w-px bg-gray-800"></div>
      </div>

      {/* Right Side with Login Form */}
      <div className="w-1/2 flex flex-col justify-center items-center bg-white">
        <div className="w-3/4 max-w-md">
          <h1 className="text-4xl font-bold mb-4 font-cousine">Welcome back!</h1>
          <p className="text-gray-600 mb-8 font-cousine">Please login to your admin account</p>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Email"
                className="w-full mt-2 p-3 border border-gray-400 rounded-lg focus:outline-none focus:ring focus:ring-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-700 font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Password"
                  className="w-full mt-2 p-3 border border-gray-400 rounded-lg focus:outline-none focus:ring focus:ring-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-5 text-gray-600"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="stay-signed-in" className="h-4 w-4 text-gray-600 focus:ring-gray-400" />
              <label htmlFor="stay-signed-in" className="ml-2 text-gray-600">
                Stay signed in
              </label>
            </div>
            <button
              type="submit"
              className="w-full p-3 bg-black text-white font-medium rounded-lg transition duration-300 hover:bg-white hover:text-black border border-black"
              disabled={loading} // Disable button while logging in
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>

      {/* Loading Modal */}
      {loading && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="loader border-t-4 border-black border-solid rounded-full w-12 h-12 animate-spin"></div>
            <p className="mt-4 text-gray-700">Logging in...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;