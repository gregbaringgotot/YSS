import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Image, PackageCheck, LogOut, FileText } from "lucide-react"; // Added FileText icon
import { signOut } from "firebase/auth";
import { auth } from "../../Database/Firebase";
import Logo from "../admin-assets/admin-logo.png";

function AdminNavbar({ logOutHandler }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logOutHandler();
      localStorage.removeItem("isLoggedIn");
      navigate("/admin");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Static Sidebar */}
      <aside className="bg-black text-white w-64 flex flex-col p-4 fixed top-0 left-0 h-full">
        
        {/* Logo */}
        <div className="flex justify-center items-center py-4">
          <img src={Logo} alt="Logo" className="w-24 h-24 object-contain" />
        </div>

        {/* Sidebar Title */}
        <div className="text-center font-bold text-sm mb-10 font-cousine">
          YOUNG SOUL SEEKERS
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col space-y-4 flex-1 font-cousine">
          <NavLink
            to="/Admindashboard"
            end
            className={({ isActive }) =>
              `group flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive ? "bg-gray-500 text-white" : "hover:bg-gray-600"
              }`
            }
          >
            <LayoutDashboard className="w-6 h-6" aria-hidden="true" />
            <span className="text-sm">DASHBOARD</span>
          </NavLink>

          <NavLink
            to="Adminshop"
            end
            className={({ isActive }) =>
              `group flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive ? "bg-gray-500 text-white" : "hover:bg-gray-600"
              }`
            }
          >
            <ShoppingCart className="w-6 h-6" aria-hidden="true" />
            <span className="text-sm">SHOP MANAGEMENT</span>
          </NavLink>

          <NavLink
            to="Adminlookbook"
            end
            className={({ isActive }) =>
              `group flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive ? "bg-gray-500 text-white" : "hover:bg-gray-600"
              }`
            }
          >
            <Image className="w-6 h-6" aria-hidden="true" />
            <span className="text-sm">LOOKBOOK MANAGEMENT</span>
          </NavLink>

          <NavLink
            to="Adminordermanagement"
            end
            className={({ isActive }) =>
              `group flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive ? "bg-gray-500 text-white" : "hover:bg-gray-600"
              }`
            }
          >
            <PackageCheck className="w-6 h-6" aria-hidden="true" />
            <span className="text-sm">ORDER MANAGEMENT</span>
          </NavLink>

          {/* Quote Management Link */}
          <NavLink
            to="adminquotes"
            end
            className={({ isActive }) =>
              `group flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive ? "bg-gray-500 text-white" : "hover:bg-gray-600"
              }`
            }
          >
            <FileText className="w-6 h-6" aria-hidden="true" />
            <span className="text-sm">QUOTE MANAGEMENT</span>
          </NavLink>
        </nav>

        {/* Logout Button */}
        <div className="mt-auto mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 hover:bg-red-600 w-full"
          >
            <LogOut className="w-6 h-6 text-white" aria-hidden="true" />
            <span className="text-sm font-cousine">LOG OUT</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className="flex-1 p-8 bg-[#FAFAFA] overflow-auto"
        style={{ marginLeft: "16rem" }}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default AdminNavbar;
