import React, { useEffect, useState } from 'react';
import { db, lookbookCollection } from '../Database/Firebase';
import { getDocs } from 'firebase/firestore';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

function Lookbook() {
  const [lookbooks, setLookbooks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const [currentLookbook, setCurrentLookbook] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchLookbooks = async () => {
      try {
        const querySnapshot = await getDocs(lookbookCollection);
        const lookbooksArray = [];
        querySnapshot.forEach((doc) => {
          lookbooksArray.push({ id: doc.id, ...doc.data() });
        });
        setLookbooks(lookbooksArray);
      } catch (error) {
        console.error("Error fetching lookbooks: ", error);
      }
    };

    fetchLookbooks();
  }, []);

  // Get unique categories from lookbooks, but exclude 'All' from the UI buttons
  const categories = [...new Set(lookbooks.map(item => item.category).filter(Boolean))];

  // Filter lookbooks by active category
  const filteredLookbooks = activeCategory === 'All' 
    ? lookbooks 
    : lookbooks.filter(item => item.category === activeCategory);

  const handleImageClick = (image, lookbook, index = 0) => {
    setCurrentImage(image);
    setCurrentLookbook(lookbook);
    setCurrentImageIndex(index);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const nextImage = () => {
    if (!currentLookbook) return;
    
    const totalImages = 1 + (currentLookbook.secondaryImages?.length || 0);
    if (currentImageIndex < totalImages - 1) {
      setCurrentImageIndex(prevIndex => prevIndex + 1);
    } else {
      setCurrentImageIndex(0); // Loop back to the first image
    }
  };

  const prevImage = () => {
    if (!currentLookbook) return;
    
    const totalImages = 1 + (currentLookbook.secondaryImages?.length || 0);
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prevIndex => prevIndex - 1);
    } else {
      setCurrentImageIndex(totalImages - 1); // Loop to the last image
    }
  };

  const getCurrentImageSrc = () => {
    if (!currentLookbook) return '';
    
    if (currentImageIndex === 0) {
      return currentLookbook.image;
    } else if (currentLookbook.secondaryImages && currentLookbook.secondaryImages[currentImageIndex - 1]) {
      return currentLookbook.secondaryImages[currentImageIndex - 1];
    }
    return '';
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative w-full h-96 bg-black overflow-hidden">
        {lookbooks.length > 0 && (
          <>
            <img 
              src={lookbooks[0]?.image || '/api/placeholder/1200/600'} 
              alt="Featured Collection" 
              className="w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-8 text-center">
              <h1 className="text-5xl font-bold mb-4 tracking-wider font-cousine ">LOOKBOOK</h1>
              <p className="text-xl max-w-2xl  ">"Sharing God's message through inspiring and uplifting designs that speak to the heart and soul.</p>
              <button 
                className="mt-10 px-6 py-3 bg-white text-black font-semibold rounded-md hover:bg-gray-200 transition duration-300 font-cousine"
                onClick={() => document.getElementById('collection').scrollIntoView({behavior: 'smooth'})}
              >
                View Collection
              </button>
            </div>
          </>
        )}
      </div>

      <div className="max-w-7xl mx-auto" id="collection">
        {/* Category Filters - 'All' button removed */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex bg-white p-1 rounded-lg shadow">
            {categories.map(category => (
              <div
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  activeCategory === category
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </div>
            ))}
          </div>
        </div>

        {/* Featured Item (if available) */}
        {filteredLookbooks.length > 0 && (
          <div className="mb-16 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 h-96">
                <img
                  src={filteredLookbooks[0]?.image || '/api/placeholder/600/600'}
                  alt={filteredLookbooks[0]?.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 cursor-pointer"
                  onClick={() => handleImageClick(filteredLookbooks[0]?.image, filteredLookbooks[0])}
                />
              </div>
              <div className="md:w-1/2 p-8 flex flex-col justify-center ml-10">
                <h2 className="text-3xl font-bold font-cousine">{filteredLookbooks[0]?.name }</h2>
                <div className="border-b-2 border-gray-900 my-6 w-20"></div>
                <div className="flex space-x-4">
                  <button 
                    className="w-60 p-3 bg-black text-white font-medium rounded-lg transition duration-300 hover:bg-white hover:text-black border border-black font-cousine"
                    onClick={() => handleImageClick(filteredLookbooks[0]?.image, filteredLookbooks[0])}
                  >
                    View Design
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lookbook Items Grid */}
        <h2 className="text-3xl font-bold text-center mb-8 font-cousine">Lookbook Collection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLookbooks.slice(1).map((lookbook) => (
            <div key={lookbook.id} className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300">
              <div className="relative overflow-hidden h-72">
                <img
                  src={lookbook.image}
                  alt={lookbook.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                  onClick={() => handleImageClick(lookbook.image, lookbook)}
                />
                {lookbook.secondaryImages && lookbook.secondaryImages.length > 0 && (
                  <div className="absolute bottom-4 right-4 px-2 py-1 bg-black text-white text-xs rounded">
                    {1 + lookbook.secondaryImages.length} photos
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 font-cousine">{lookbook.name}</h3>
                <button 
                  className="w-full py-2 border-2 border-black text-black font-medium rounded hover:bg-black hover:text-white transition-colors duration-300 font-cousine"
                  onClick={() => handleImageClick(lookbook.image, lookbook)}
                >
                  View Design
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Full-Screen Image */}
      {showModal && currentLookbook && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
          <div className="relative w-full max-w-5xl px-4">
            {/* Main image */}
            <img
              src={getCurrentImageSrc()}
              alt={currentLookbook.name}
              className="w-full h-auto max-h-[80vh] object-contain mx-auto"
            />

            {/* Image counter */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {1 + (currentLookbook.secondaryImages?.length || 0)}
            </div>

            {/* T-shirt details */}
            <div className="absolute bottom-0 left-0 right-0 bg-white p-4 bg-opacity-95">
              <h3 className="text-xl font-bold">{currentLookbook.name}</h3>
            </div>

            {/* Navigation */}
            <div 
              onClick={prevImage}
              className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition duration-300 cursor-pointer"
            >
              <ChevronLeft size={24} className="text-black" />
            </div>
            <div
              onClick={nextImage}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition duration-300 cursor-pointer"
            >
              <ChevronRight size={24} className="text-black" />
            </div>

            {/* Thumbnail navigation (if there are secondary images) */}
            {currentLookbook.secondaryImages && currentLookbook.secondaryImages.length > 0 && (
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 overflow-x-auto py-2 max-w-full">
                <div 
                  className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 ${currentImageIndex === 0 ? 'border-white' : 'border-transparent'}`}
                  onClick={() => setCurrentImageIndex(0)}
                >
                  <img src={currentLookbook.image} alt="thumbnail" className="w-full h-full object-cover" />
                </div>
                {currentLookbook.secondaryImages.map((img, idx) => (
                  <div 
                    key={idx}
                    className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 ${currentImageIndex === idx + 1 ? 'border-white' : 'border-transparent'}`}
                    onClick={() => setCurrentImageIndex(idx + 1)}
                  >
                    <img src={img} alt={`thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Close */}
            <div
              onClick={closeModal}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition duration-300 cursor-pointer"
            >
              <X size={24} className="text-black" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Lookbook;