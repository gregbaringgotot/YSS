import React from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { NavLink } from "react-router-dom";

function Footer() {
  return (
    <>
      <footer className="bg-[#FAFAFA] text-black border-t border-gray-300">
        <div className="w-full ">
          {/* Upper Footer Line - Thicker Border Above */}
          <div className="border-t-4 border-black mb-8"></div>

          {/* Logo and Social Media Section */}
          <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start space-y-8 lg:space-y-0 p-4 mt-1 mb-1 lg:p-12 lg:mt-6 lg:mb-6">
            <div className="flex flex-col items-center lg:items-start space-y-4">
              <img
                src="\src\assets\YSS LOGO PNG 2.png"
                alt="YSS Logo"
                className="h-16 w-auto"
              />
              <p className="text-gray-700 font-cousine font-bold text-center lg:text-left">
                Young Soul Seekers
              </p>
              <div className="flex space-x-6">
                  <a
                    href="https://www.facebook.com/young.soul.seekers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black hover:text-gray-800 text-3xl"
                    aria-label="Facebook"
                  >
                    <i className="fab fa-facebook"></i>
                  </a>
                  <a
                    href="https://www.tiktok.com/@young.soul.seekers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black hover:text-gray-800 text-3xl"
                    aria-label="TikTok"
                  >
                    <i className="fab fa-tiktok"></i>
                  </a>
                  <a
                    href="https://www.instagram.com/young.soul.seekers/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black hover:text-gray-800 text-3xl"
                    aria-label="Instagram"
                  >
                    <i className="fab fa-instagram"></i>
                  </a>
                </div>
            </div>
            {/* Links Section */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 text-center lg:text-left">
              {/* Service */}
              <div>
                <h3 className="text-gray-800 font-bold uppercase mb-4 font-cousine">Service</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>
                    <NavLink
                      to="/shop"
                      className={({ isActive }) =>
                        isActive ? "text-black underline" : "hover:underline"
                      }
                    >
                      Shop
                    </NavLink>
                  </li>
                </ul>
              </div>

              {/* Explore */}
              <div>
                <h3 className="text-gray-800 font-bold uppercase mb-4 font-cousine">Explore</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>
                    <NavLink
                      to="/lookbook"
                      className={({ isActive }) =>
                        isActive ? "text-black-500 underline" : "hover:underline"
                      }
                    >
                      Lookbook
                    </NavLink>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-gray-800 font-bold uppercase mb-4 font-cousine">Support</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>
                    <NavLink
                      to="/faq"
                      className={({ isActive }) =>
                        isActive ? "text-black-500 underline" : "hover:underline"
                      }
                    >
                      FAQ
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/contact"
                      className={({ isActive }) =>
                        isActive ? "text-black-500 underline" : "hover:underline"
                      }
                    >
                      Contact
                    </NavLink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom with Black Background */}
        <div className="bg-black text-white text-center py-4 font-cousine">
          <p className="text-sm">© 2024 Young Soul Seekers. All Rights Reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default Footer;
