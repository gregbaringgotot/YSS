import React, { useState, useEffect } from "react";
import { db, shopCollection } from "../Database/Firebase";
import { addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import axios from "axios";
import { 
  X, Trash2, Edit2, Plus, Search, 
  Package, ArrowUpDown, Loader2
} from 'lucide-react';

function AdminShop() {
  // State Management
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortOrder, setSortOrder] = useState("name_asc");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentProduct, setCurrentProduct] = useState({
    id: null,
    name: "",
    price: "",
    image: [],
    secondaryImages: [],
    category: "premium tees",
    color: "",
    featured: false,  // Added featured field
    stocks: {
      small: 0,
      medium: 0,
      large: 0,
      xl: 0,
    },
  });
  const sizeMap = {
    small: 'S',
    medium: 'M',
    large: 'L',
    xl: 'XL',
  };
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all"); // "all", "in-stock", "low-stock", "out-of-stock"
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch products from Firestore
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const q = query(shopCollection, orderBy("name")); // Order by name by default
      const querySnapshot = await getDocs(q);
      const productsArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        color: doc.data().color || "",
        featured: doc.data().featured || false,
        stocks: doc.data().stocks || { small: 0, medium: 0, large: 0, xl: 0 },
      }));
      setProducts(productsArray);
      setFilteredProducts(productsArray);
    } catch (error) {
      console.error("Firestore Fetch Error:", error);
      showNotification("Failed to load products. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products based on search, category, and stock
  useEffect(() => {
    let filtered = [...products];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((product) => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.color.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }
    
    // Stock filter
    if (stockFilter !== "all") {
      filtered = filtered.filter((product) => {
        const totalStock = Object.values(product.stocks).reduce((sum, count) => sum + count, 0);
        
        if (stockFilter === "out-of-stock") return totalStock === 0;
        if (stockFilter === "low-stock") return totalStock > 0 && totalStock < 20;
        if (stockFilter === "in-stock") return totalStock >= 20;
        
        return true;
      });
    }
    
    // Apply sorting
    filtered = sortProducts(filtered, sortOrder);
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, stockFilter, products, sortOrder]);

  // Sort products
  const sortProducts = (productList, order) => {
    const sorted = [...productList];
    
    switch (order) {
      case "name_asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name_desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "price_asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price_desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "stock_asc":
        return sorted.sort((a, b) => {
          const totalStockA = Object.values(a.stocks).reduce((sum, count) => sum + count, 0);
          const totalStockB = Object.values(b.stocks).reduce((sum, count) => sum + count, 0);
          return totalStockA - totalStockB;
        });
      case "stock_desc":
        return sorted.sort((a, b) => {
          const totalStockA = Object.values(a.stocks).reduce((sum, count) => sum + count, 0);
          const totalStockB = Object.values(b.stocks).reduce((sum, count) => sum + count, 0);
          return totalStockB - totalStockA;
        });
      default:
        return sorted;
    }
  };

  // Handle stock change
  const handleStockChange = (e, size) => {
    const { value } = e.target;
    setCurrentProduct((prev) => ({
      ...prev,
      stocks: { ...prev.stocks, [size]: Number(value) || 0 },
    }));
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setCurrentProduct((prev) => ({ ...prev, [name]: newValue }));
  };

  // Cloudinary Image Upload
  const handleImageUpload = async (e, imageType) => {
    const files = e.target.files;
    if (!files.length) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "product_shop");
        formData.append("cloud_name", "dm97yk6vr");
      
        const response = await axios.post(
          "https://api.cloudinary.com/v1_1/dm97yk6vr/image/upload",
          formData
        );
        
        return response.data.secure_url;
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      
      if (imageType === "primary") {
        setCurrentProduct((prev) => ({ ...prev, image: uploadedUrls }));
      } else {
        setCurrentProduct((prev) => ({ ...prev, secondaryImages: uploadedUrls }));
      }
      
      showNotification("Images uploaded successfully!", "success");
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      showNotification("Failed to upload images. Please try again.", "error");
    }
  };
  
  // Save product to Firestore
  const handleSave = async () => {
    // Validate required fields
    if (!currentProduct.name || !currentProduct.price) {
      showNotification("Product name and price are required.", "error");
      return;
    }
    
    if (currentProduct.image.length === 0) {
      showNotification("Please upload at least one product image.", "error");
      return;
    }
  
    setIsSubmitting(true);
    
    try {
      if (currentProduct.id) {
        // Update existing product
        const productRef = doc(db, "shop", currentProduct.id);
        await updateDoc(productRef, {
          name: currentProduct.name,
          price: Number(currentProduct.price),
          image: currentProduct.image,
          secondaryImages: currentProduct.secondaryImages,
          category: currentProduct.category,
          color: currentProduct.color,
          featured: currentProduct.featured,
          stocks: currentProduct.stocks,
          updatedAt: new Date().toISOString(),
        });
  
        setProducts((prev) =>
          prev.map((product) =>
            product.id === currentProduct.id ? { ...currentProduct } : product
          )
        );
  
        showNotification("Product updated successfully!", "success");
      } else {
        // Add new product
        const docRef = await addDoc(shopCollection, {
          name: currentProduct.name,
          price: Number(currentProduct.price),
          image: currentProduct.image,
          secondaryImages: currentProduct.secondaryImages,
          category: currentProduct.category,
          color: currentProduct.color,
          featured: currentProduct.featured,
          stocks: currentProduct.stocks,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
  
        setProducts((prev) => [...prev, { ...currentProduct, id: docRef.id }]);
  
        showNotification("Product added successfully!", "success");
      }
  
      setShowModal(false);
    } catch (error) {
      console.error("Firestore Save Error:", error);
      showNotification("Failed to save product. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete product from Firestore
  const handleDelete = async () => {
    if (!currentProduct.id) return;
  
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      await deleteDoc(doc(db, "shop", currentProduct.id)); // Delete from Firestore
      setProducts((prev) => prev.filter((product) => product.id !== currentProduct.id)); // Update local state
      showNotification("Product deleted successfully!", "success"); // Show success notification
      setShowModal(false); // Close modal
    } catch (error) {
      console.error("Delete Error:", error);
      showNotification("Failed to delete product. Please try again.", "error");
    } finally {
      setIsSubmitting(false); // Stop submitting state
    }
  };
  
  
  // Show notification
  const showNotification = (message, type = "info") => {
    setNotification({ show: true, message, type });
    
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };
  
  // Calculate total stock for a product
  const getTotalStock = (stocks) => {
    return Object.values(stocks).reduce((sum, count) => sum + count, 0);
  };
  
  // Determine stock status and color
  const getStockStatus = (stock) => {
    if (stock === 0) return { text: "Out of stock", color: "text-red-500 bg-red-50" };
    if (stock < 10) return { text: "Low stock", color: "text-orange-500 bg-orange-50" };
    if (stock < 30) return { text: "Medium stock", color: "text-yellow-600 bg-yellow-50" };
    return { text: "In stock", color: "text-green-500 bg-green-50" };
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 font-cousine ">SHOP MANAGEMENT</h1>
      </div>
      
      {/* Filters and Actions */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-2 w-full md:w-40">
              <label className="text-sm text-gray-600">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="premium tees">Premium Tees</option>
                <option value="basic tees">Basic Tees</option>
                <option value="new">New Arrivals</option>
              </select>
            </div>

            {/* Stock Filter */}
            <div className="flex items-center gap-2 w-full md:w-40">
              <label className="text-sm text-gray-600">Stock:</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Stock</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-2 w-full md:w-40">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="price_asc">Price (Low-High)</option>
                <option value="price_desc">Price (High-Low)</option>
                <option value="stock_asc">Stock (Low-High)</option>
                <option value="stock_desc">Stock (High-Low)</option>
              </select>
            </div>
          </div>

          
          {/* Add Product Button */}
          <button
            onClick={() => {
              setCurrentProduct({ 
                id: null, 
                name: "", 
                price: "", 
                image: [], 
                secondaryImages: [], 
                category: "premium tees",
                color: "",
                featured: false,
                stocks: { small: 0, medium: 0, large: 0, xl: 0 } 
              });
              setShowModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Add Product
          </button>
        </div>
      </div>
      
      {/* Results summary */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
          {selectedCategory !== "all" && ` in ${selectedCategory}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
        
        <button 
          onClick={fetchProducts}
          className="text-sm flex items-center text-gray-600 hover:text-black"
        >
          <ArrowUpDown size={14} className="mr-1" /> Refresh
        </button>
      </div>
      
      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory !== "all" || stockFilter !== "all" 
              ? "Try adjusting your filters to see more products." 
              : "Start by adding your first product to the inventory."}
          </p>
          {(searchQuery || selectedCategory !== "all" || stockFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setStockFilter("all");
              }}
              className="text-black hover:underline font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md"
            >
              {/* Product Image with Hover Effect */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                {product.image && product.image.length > 0 ? (
                  <>
                    <img
                      src={product.image[0]}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                    />
                    {product.secondaryImages && product.secondaryImages.length > 0 && (
                      <img
                        src={product.secondaryImages[0]}
                        alt={`${product.name} alternate view`}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 hover:opacity-100 transition-opacity duration-300"
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package size={48} className="text-gray-300" />
                  </div>
                )}
                
                {/* Featured Badge */}
                {product.featured && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                    Featured
                  </div>
                )}
                
                {/* Category Badge */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {product.category}
                </div>
              </div>
              
              {/* Product Details */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">₱{Number(product.price).toLocaleString()}</span>
                  
                  {/* Color Tag */}
                  {product.color && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {product.color}
                    </span>
                  )}
                </div>
                
                {/* Stock Summary */}
                <div className="mt-1 mb-3">
                  {(() => {
                    const totalStock = getTotalStock(product.stocks);
                    const { text, color } = getStockStatus(totalStock);
                    
                    return (
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                        {text}: {totalStock} units
                      </div>
                    );
                  })()}
                </div>
                
                {/* Size Stock Grid */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-xs font-medium mt-auto">
                  {Object.entries(product.stocks).map(([size, count]) => {
                    const stockColor = count === 0 
                      ? "bg-gray-100 text-gray-400" 
                      : count < 10 
                        ? "bg-red-50 text-red-600" 
                        : "bg-green-50 text-green-600";
                    
                    return (
                      <div 
                        key={size}
                        className={`flex flex-col items-center justify-center px-1 py-2 rounded ${stockColor}`}
                      >
                        <span className="uppercase">{sizeMap[size]}</span>  {/* Use the sizeMap to display the new size */}
                        <span className="font-bold">{count}</span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCurrentProduct(product);
                        setShowModal(true);
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <Edit2 size={16} className="mr-2" />
                      Edit
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        setCurrentProduct(product);
                        setSelectedProduct(product);
                        handleDelete();
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </button>
                  </div>
              </div>
            </div>
          ))}
          
          {/* New Product Card */}
          <div
            onClick={() => {
              setCurrentProduct({ 
                id: null, 
                name: "", 
                price: "", 
                image: [], 
                secondaryImages: [], 
                category: "premium tees",
                color: "",
                featured: false,
                stocks: { small: 0, medium: 0, large: 0, xl: 0 } 
              });
              setShowModal(true);
            }}
            className="border border-dashed border-gray-300 rounded-lg flex items-center justify-center min-h-[300px] bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="text-center p-6">
              <div className="bg-gray-100 rounded-full p-4 inline-block mb-3">
                <Plus size={24} className="text-gray-500" />
              </div>
              <h3 className="font-medium text-gray-800 mb-1">Add New Product</h3>
              <p className="text-sm text-gray-500">Click to add a new product to your inventory</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800">
                {currentProduct.id ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {/* Product Name */}
                  <div className="mb-4">
                    <label className="block font-medium text-gray-700 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={currentProduct.name}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  
                  {/* Price */}
                  <div className="mb-4">
                    <label className="block font-medium text-gray-700 mb-1">
                      Price (₱) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={currentProduct.price}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter price"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  {/* Category */}
                  <div className="mb-4">
                    <label className="block font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={currentProduct.category}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="premium tees">Premium Tees</option>
                      <option value="basic tees">Basic Tees</option>
                      <option value="new">New Arrivals</option>
                    </select>
                  </div>
                  
                  {/* Color */}
                  <div className="mb-4">
                    <label className="block font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={currentProduct.color || ""}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="e.g. Black, White, Red"
                    />
                  </div>
                  
                  {/* Featured */}
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={currentProduct.featured || false}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-gray-300 rounded text-black focus:ring-black"
                      />
                      <span className="ml-2 text-gray-700">Feature this product</span>
                    </label>
                  </div>

                </div>
                
                <div>
                  {/* Stock Management */}
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-800 mb-2">Stock Management</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(currentProduct.stocks || {}).map(([size, count]) => (
                        <div key={size} className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {size.charAt(0).toUpperCase() + size.slice(1)}
                          </label>
                          <input
                            type="number"
                            value={count}
                            onChange={(e) => handleStockChange(e, size)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder={`${size.charAt(0).toUpperCase() + size.slice(1)} stock`}
                            min="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Image Upload */}
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-800 mb-2">Product Images</h3>
                    
                    {/* Primary Images */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Image (Front) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center">
                        <input
                          type="file"
                          onChange={(e) => handleImageUpload(e, "primary")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          accept="image/*"
                        />
                      </div>
                    </div>
                    
                    {/* Secondary Images */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Secondary Images (Back)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="file"
                          multiple
                          onChange={(e) => handleImageUpload(e, "secondary")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          accept="image/*"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save and Cancel Buttons */}
            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`ml-3 px-6 py-2 text-white rounded-lg ${isSubmitting ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : currentProduct.id ? "Update Product" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 bg-${notification.type === 'error' ? 'red' : 'green'}-500 text-white py-2 px-4 rounded-lg shadow-lg`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default AdminShop;