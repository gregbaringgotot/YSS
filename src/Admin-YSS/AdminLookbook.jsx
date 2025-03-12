import React, { useState, useEffect } from 'react';
import { db, lookbookCollection } from '../Database/Firebase';
import { addDoc, getDocs, deleteDoc, doc, updateDoc, collection, query, orderBy } from 'firebase/firestore';
import axios from 'axios';
import { CLOUDINARY_UPLOAD_PRESET_LOOKBOOK, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_URL } from '../Database/Firebase';
import { X, Trash2, Edit2, Plus, Upload, AlertCircle, Check } from 'lucide-react';

function AdminLookbook() {
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [secondaryImageFiles, setSecondaryImageFiles] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [secondaryImages, setSecondaryImages] = useState([]);
  const [lookbooks, setLookbooks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  // Max file size in bytes (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  // Allowed file types
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Validate image file
  const validateImageFile = (file) => {
    if (!file) return true;
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB limit';
    }
    
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, and GIF files are allowed';
    }
    
    return true;
  };

  // Handle image uploads with validation
  const handleImageUpload = (e, isSecondary = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationResult = validateImageFile(file);
    
    if (validationResult !== true) {
      showNotification(validationResult, 'error');
      return;
    }

    try {
      const objectURL = URL.createObjectURL(file);
      
      if (isSecondary) {
        setSecondaryImageFiles((prev) => [...prev, file]);
        setSecondaryImages((prev) => [...prev, objectURL]);
      } else {
        setImageFile(file);
        setImageUrl(objectURL);
      }
      
      // Clear any previous errors
      setErrors((prev) => ({
        ...prev,
        [isSecondary ? 'secondaryImages' : 'mainImage']: null
      }));
    } catch (error) {
      console.error('Error creating object URL:', error);
      showNotification(`Error processing image: ${error.message}`, 'error');
    }
  };

  const handleRemoveImage = (index, isSecondary = false) => {
    try {
      if (isSecondary) {
        // Create new arrays without the removed image
        const newSecondaryImages = secondaryImages.filter((_, i) => i !== index);
        const newSecondaryImageFiles = secondaryImageFiles.filter((_, i) => i !== index);
        
        setSecondaryImages(newSecondaryImages);
        setSecondaryImageFiles(newSecondaryImageFiles);
      } else {
        // Revoke the object URL to prevent memory leaks
        if (imageUrl && imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(imageUrl);
        }
        
        setImageUrl('');
        setImageFile(null);
      }
    } catch (error) {
      console.error('Error removing image:', error);
      showNotification(`Error removing image: ${error.message}`, 'error');
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!isEditing && !imageFile && !imageUrl) {
      newErrors.mainImage = 'Main image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      const errorMessage = Object.values(errors)[0];
      showNotification(errorMessage, 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let mainImageUrl = imageUrl;
      let secondaryImageUrls = [...secondaryImages];

      // Upload the main image if it's a new file
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append('file', imageFile);
          formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET_LOOKBOOK);
          formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

          const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
          mainImageUrl = response.data.secure_url;
        } catch (uploadError) {
          console.error('Error uploading main image:', uploadError);
          throw new Error(`Main image upload failed: ${uploadError.message}`);
        }
      }

      // Upload secondary images if they're new files
      const uploadPromises = secondaryImageFiles.map(async (file, index) => {
        // Only upload new files (those that don't have a URL from Cloudinary)
        if (file instanceof File) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET_LOOKBOOK);
            formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

            const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
            return response.data.secure_url;
          } catch (uploadError) {
            console.error(`Error uploading secondary image ${index}:`, uploadError);
            throw new Error(`Secondary image ${index + 1} upload failed: ${uploadError.message}`);
          }
        }
        return secondaryImageUrls[index]; // Keep existing URL
      });

      const uploadedSecondaryImages = await Promise.all(uploadPromises);

      // Create or update lookbook
      if (isEditing && editingId) {
        try {
          const lookbookDoc = doc(db, 'lookbook', editingId);
          await updateDoc(lookbookDoc, {
            name: title,
            image: mainImageUrl,
            secondaryImages: uploadedSecondaryImages,
            updatedAt: new Date(),
          });
          showNotification('Lookbook updated successfully!');
        } catch (updateError) {
          console.error('Error updating lookbook:', updateError);
          throw new Error(`Failed to update lookbook: ${updateError.message}`);
        }
      } else {
        try {
          await addDoc(lookbookCollection, {
            name: title,
            image: mainImageUrl,
            secondaryImages: uploadedSecondaryImages,
            createdAt: new Date(),
          });
          showNotification('Lookbook added successfully!');
        } catch (addError) {
          console.error('Error adding lookbook:', addError);
          throw new Error(`Failed to add lookbook: ${addError.message}`);
        }
      }

      resetForm();
      setIsModalOpen(false);
      fetchLookbooks();
    } catch (error) {
      console.error('Error in lookbook submission:', error);
      showNotification(error.message || 'Error processing lookbook', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch lookbooks with error handling and retry
  const fetchLookbooks = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    try {
      // Create a query to order by timestamp (descending)
      const q = query(collection(db, 'lookbook'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const lookbooksArray = [];
      querySnapshot.forEach((doc) => {
        lookbooksArray.push({ id: doc.id, ...doc.data() });
      });
      setLookbooks(lookbooksArray);
    } catch (error) {
      console.error('Error fetching lookbooks:', error);
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying fetch (${retryCount + 1}/${MAX_RETRIES})...`);
        setTimeout(() => fetchLookbooks(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        showNotification(`Error fetching lookbooks: ${error.message}. Please refresh the page.`, 'error');
      }
    }
  };

  // Delete lookbook with confirmation and error handling
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lookbook?')) {
      setIsLoading(true);
      try {
        const lookbookDoc = doc(db, 'lookbook', id);
        await deleteDoc(lookbookDoc);
        showNotification('Lookbook deleted successfully!');
        fetchLookbooks();
      } catch (error) {
        console.error('Error deleting lookbook:', error);
        showNotification(`Error deleting lookbook: ${error.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Edit lookbook with error handling
  const handleEdit = (lookbook) => {
    try {
      setIsEditing(true);
      setEditingId(lookbook.id);
      setTitle(lookbook.name || '');
      setImageUrl(lookbook.image || '');
      setSecondaryImages(lookbook.secondaryImages || []);
      setSecondaryImageFiles(lookbook.secondaryImages || []);
      setIsModalOpen(true);
      // Skip first step since we're editing
      setCurrentStep(2);
    } catch (error) {
      console.error('Error setting up edit mode:', error);
      showNotification(`Error preparing lookbook for editing: ${error.message}`, 'error');
    }
  };

  const resetForm = () => {
    setTitle('');
    
    // Revoke any blob URLs to prevent memory leaks
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    
    secondaryImages.forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    
    setImageUrl('');
    setImageFile(null);
    setSecondaryImages([]);
    setSecondaryImageFiles([]);
    setIsEditing(false);
    setEditingId(null);
    setCurrentStep(1);
    setErrors({});
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Handle next step in form
  const handleNextStep = (e) => {
    e.preventDefault();
    
    // Validate title
    if (!title.trim()) {
      setErrors({ title: 'Please enter a title for the lookbook' });
      showNotification('Please enter a title for the lookbook', 'error');
      return;
    }
    
    setCurrentStep(2);
  };

  // Handle previous step in form
  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  // Cleanup function for image object URLs
  useEffect(() => {
    // Cleanup function to revoke object URLs when component unmounts
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
      
      secondaryImages.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrl, secondaryImages]);

  // Fetch lookbooks on component mount
  useEffect(() => {
    fetchLookbooks();
    
    // Add event listener for network status changes
    const handleOnline = () => {
      showNotification('Network connection restored. Refreshing data...', 'success');
      fetchLookbooks();
    };
    
    const handleOffline = () => {
      showNotification('Network connection lost. Some features may be unavailable.', 'error');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Error boundary effect
  useEffect(() => {
    const errorHandler = (event) => {
      console.error('Unhandled error:', event.error);
      showNotification('An unexpected error occurred. Please refresh the page.', 'error');
      event.preventDefault();
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  return (
    <div className="min-h-screen max-w-full mx-auto bg-gray-50 rounded-lg">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
          notification.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
          <span>{notification.message}</span>
        </div>
      )}
      
      <div className="mb-4 flex justify-between items-center ">
        <h2 className="text-3xl font-semibold text-gray-800 font-cousine">LOOKBOOK MANAGEMENT</h2>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-[#2C2C2C] text-white rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
          disabled={isLoading}
        >
          <Plus size={18} /> Add New Lookbook
        </button>
      </div>

      {/* Loading state for initial fetch */}
      {isLoading && lookbooks.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-100 rounded-lg">
          <p className="text-gray-600">Loading lookbooks...</p>
        </div>
      )}

      {/* Grid for Lookbooks */}
      {!isLoading && lookbooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-100 rounded-lg">
          <p className="text-gray-600 mb-4">No lookbooks found</p>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-[#2C2C2C] text-white rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
            disabled={isLoading}
          >
            <Plus size={18} /> Create Your First Lookbook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {lookbooks.map((lookbook) => (
            <div key={lookbook.id} className="flex flex-col p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="relative pb-[100%] overflow-hidden rounded-lg mb-4">
                <img
                  src={lookbook.image}
                  alt={lookbook.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                  }}
                />
              </div>
              <h4 className="text-xl font-semibold mb-2 line-clamp-1">{lookbook.name}</h4>
              <p className="text-sm text-gray-500 mb-4">
                {lookbook.secondaryImages?.length || 0} additional images
              </p>
              <div className="mt-auto flex space-x-3">
                <button
                  onClick={() => handleEdit(lookbook)}
                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-1"
                  disabled={isLoading}
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(lookbook.id)}
                  className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
                  disabled={isLoading}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Adding/Editing Lookbook */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl relative">
            <button 
              onClick={handleCloseModal} 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition-colors"
              disabled={isLoading}
            >
              <X size={24} />
            </button>

            <div className="overflow-y-auto max-h-[80vh]">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-semibold">
                  {isEditing ? 'Edit Lookbook' : 'Create New Lookbook'}
                </h3>
                {!isEditing && (
                  <div className="flex mt-4">
                    <div className="w-full flex justify-between items-center">
                      <div className="flex">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 ${currentStep >= 1 ? 'bg-[#2C2C2C] text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
                        <span className="text-sm">Basic Info</span>
                      </div>
                      <div className="h-px bg-gray-300 flex-grow mx-4"></div>
                      <div className="flex">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 ${currentStep >= 2 ? 'bg-[#2C2C2C] text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
                        <span className="text-sm">Upload Images</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {currentStep === 1 && !isEditing ? (
                <form onSubmit={handleNextStep} className="p-6 space-y-6">
                  {/* Title Input - Step 1 */}
                  <div>
                    <label className="block font-medium mb-2 text-gray-700">Lookbook Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full p-3 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400`}
                      placeholder="Enter lookbook title"
                      required
                      autoFocus
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                  </div>

                  {/* Next Button */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg mr-2 hover:bg-gray-50 transition-colors"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#2C2C2C] text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                      disabled={isLoading}
                    >
                      Next
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Show title in step 2 for reference */}
                  {!isEditing && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-700">Lookbook Title:</h4>
                      <p className="text-lg">{title}</p>
                    </div>
                  )}

                  {/* If editing, show the title field */}
                  {isEditing && (
                    <div>
                      <label className="block font-medium mb-2 text-gray-700">Lookbook Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={`w-full p-3 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400`}
                        placeholder="Enter lookbook title"
                        required
                      />
                      {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                    </div>
                  )}

                  {/* Main Image Upload */}
                  <div>
                    <label className="block font-medium mb-2 text-gray-700">Main Cover Image</label>
                    <div className={`border-2 border-dashed ${errors.mainImage ? 'border-red-500' : 'border-gray-300'} rounded-lg p-4 text-center`}>
                      {imageUrl ? (
                        <div className="relative">
                          <img 
                            src={imageUrl} 
                            alt="Preview" 
                            className="w-full h-48 object-contain mx-auto rounded-lg"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/300?text=Image+Error';
                              showNotification('Failed to load image preview', 'error');
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(0, false)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            disabled={isLoading}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="py-10">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={(e) => handleImageUpload(e, false)}
                        className={`w-full ${imageUrl ? 'hidden' : 'opacity-0 absolute inset-0 cursor-pointer'}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.mainImage && <p className="mt-1 text-sm text-red-500">{errors.mainImage}</p>}
                  </div>

                  {/* Secondary Images Upload */}
                  <div>
                    <label className="block font-medium mb-2 text-gray-700">Secondary Images</label>
                    <div className={`border-2 border-dashed ${errors.secondaryImages ? 'border-red-500' : 'border-gray-300'} rounded-lg p-4`}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                        {secondaryImages.map((url, index) => (
                          <div key={index} className="relative h-32">
                            <img 
                              src={url} 
                              alt={`Secondary ${index}`} 
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/300?text=Image+Error';
                                showNotification(`Failed to load secondary image ${index + 1}`, 'error');
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index, true)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              disabled={isLoading}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <div className="relative border border-gray-300 rounded-lg flex flex-col items-center justify-center h-32 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                          <Upload className="h-8 w-8 text-gray-400" />
                          <p className="mt-1 text-xs text-gray-500">Add Image</p>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={(e) => handleImageUpload(e, true)}
                            className="opacity-0 absolute inset-0 cursor-pointer"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                    {errors.secondaryImages && <p className="mt-1 text-sm text-red-500">{errors.secondaryImages}</p>}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg mr-auto hover:bg-gray-50 transition-colors"
                        disabled={isLoading}
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg mr-2 hover:bg-gray-50 transition-colors"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-[#2C2C2C] text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      {isLoading ? 'Processing...' : isEditing ? 'Update Lookbook' : 'Create Lookbook'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLookbook;