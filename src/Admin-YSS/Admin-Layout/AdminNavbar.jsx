import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutGrid, 
  ShoppingCart, 
  Image, 
  PackageCheck, 
  LogOut, 
  FileText,
  Archive
} from "lucide-react";
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
      <aside className="bg-black text-white w-64 flex flex-col fixed top-0 left-0 h-full">
        {/* Logo */}
        <div className="flex flex-col items-center pt-6 pb-2">
          <img src={Logo} alt="Logo" className="w-24 h-24 object-contain" />
        </div>

        {/* Brand Name */}
        <div className="text-center font-bold text-md py-4 border-b border-gray-800 mx-4 mb-6">
          YOUNG SOUL SEEKERS
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col px-4 space-y-2 flex-1 font-mono">
          <NavLink
            to="/Admindashboard"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 ${
                isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            <LayoutGrid className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">DASHBOARD</span>
          </NavLink>

          <NavLink
            to="Adminshop"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 ${
                isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            <ShoppingCart className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">SHOP MANAGEMENT</span>
          </NavLink>

          <NavLink
            to="Adminlookbook"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 ${
                isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            <Image className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">LOOKBOOK MANAGEMENT</span>
          </NavLink>

          <NavLink
            to="Adminordermanagement"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 ${
                isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            <PackageCheck className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">ORDER MANAGEMENT</span>
          </NavLink>

          <NavLink
            to="adminarchive"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 ${
                isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            <Archive className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">ARCHIVE MANAGEMENT</span>
          </NavLink>

          <NavLink
            to="adminquotes"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 ${
                isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            <FileText className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm">QUOTE MANAGEMENT</span>
          </NavLink>
        </nav>

        {/* Logout Button */}
        <div className="px-4 mb-6 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 hover:bg-gray-800 w-full"
          >
            <LogOut className="w-5 h-5 text-gray-300" aria-hidden="true" />
            <span className="text-sm text-gray-300">LOG OUT</span>
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