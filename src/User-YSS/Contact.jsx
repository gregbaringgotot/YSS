import React, { useState } from "react";
import axios from "axios";
import { 
  User, 
  Phone, 
  Mail, 
  MessageCircle, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  MapPin 
} from "lucide-react";
import ContactBG from "../../src/assets/Contact-Images/RightsideBackground.png";

// Notification Modal Component
const NotificationModal = ({ type, message, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
        >
          <X size={24} />
        </button>
        <div className="flex flex-col items-center space-y-4">
          {type === 'success' ? (
            <CheckCircle2 size={64} className="text-green-500" />
          ) : (
            <AlertTriangle size={64} className="text-red-500" />
          )}
          
          <h2 className="text-2xl font-bold text-center">
            {type === 'success' ? 'Message Sent Successfully' : 'Error Sending Message'}
          </h2>
          
          <p className="text-center text-gray-600">
            {message}
          </p>
          
          <button 
            onClick={onClose} 
            className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    comment: "",
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/send", formData);
      setNotification({
        type: 'success',
        message: response.data.message || 'Your message has been sent successfully. We will get back to you soon!'
      });
      setFormData({ name: "", phone: "", email: "", comment: "" }); // Reset form
    } catch (error) {
      console.error("Error sending message:", error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to send message. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <>
      {notification && (
        <NotificationModal 
          type={notification.type} 
          message={notification.message} 
          onClose={closeNotification} 
        />
      )}
      
      <div className="flex justify-center items-center min-h-screen w-full mx-auto py-12 mt-10">
        <div className="flex w-full max-w-5xl bg-white shadow-2xl rounded-2xl overflow-hidden">
          {/* Left Side - Contact Form */}  
          <div className="w-1/2 p-10 bg-[#F9F9F9]">
            <h2 className="text-center text-4xl font-bold mb-8 text-black uppercase tracking-wider font-cousine">
              CONTACT US
            </h2>
            <p className="text-center text-gray-600 mb-8 px-4">
              Have a question or want to collaborate? Fill out the form below, and we'll get back to you soon.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Full Name *"
                  className="w-full pl-10 p-3 border-b-2 border-black bg-transparent focus:outline-none focus:border-gray-700"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  className="w-full pl-10 p-3 border-b-2 border-black bg-transparent focus:outline-none focus:border-gray-700"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email Address *"
                  className="w-full pl-10 p-3 border-b-2 border-black bg-transparent focus:outline-none focus:border-gray-700"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 pt-3">
                  <MessageCircle className="text-gray-400" />
                </div>
                <textarea
                  name="comment"
                  placeholder="Your Message *"
                  className="w-full pl-10 p-3 border-b-2 border-black bg-transparent h-32 focus:outline-none focus:border-gray-700 resize-none"
                  value={formData.comment}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded-full hover:bg-gray-800 transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Message"}
                <Send size={20} />
              </button>
            </form>
          </div>

          {/* Right Side - Contact Info */}
          <div className="w-1/2 p-8 flex flex-col justify-center relative">
            <img src={ContactBG} alt="Contact Background" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black opacity-70"></div>
            <div className="relative z-10 text-white self-start pl-10">
              <h2 className="text-3xl font-bold mb-6 uppercase tracking-wider font-cousine">Contact Information</h2>
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center gap-4 text-lg">
                  <Mail className="text-white" size={24} />
                  <p>youngsoulseekers@gmail.com</p>
                </div>
                <div className="flex items-center gap-4 text-lg">
                  <Phone className="text-white" size={24} />
                  <p>09982113817</p>
                </div>
                <div className="flex items-center gap-4 text-lg">
                  <MapPin className="text-white" size={24} />
                  <p>Kalawisan, Lapu-Lapu City, Cebu, Philippines</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Contact;