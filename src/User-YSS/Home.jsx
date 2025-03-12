"use client"

import { useState, useEffect, useRef } from "react"
import "tailwindcss/tailwind.css"
import { getQuotesFromFirestore } from '../Database/Firebase'; // Import Firestore function for fetching quotes

// Import images
import slide1 from "../assets/Home-Images/carousel1.png"
import slide2 from "../assets/Home-Images/carousel2.png"
import slide3 from "../assets/Home-Images/carousel3.png"
import slide4 from "../assets/Home-Images/carousel4.png"

// Images Features
import premiumTeesImg from "../assets/Home-Images/premuim-tees.png"
import basicTeesImg from "../assets/Home-Images/basic-tees.png"
import newProductsImg from "../assets/Home-Images/new-product.png"

const images = [
  { src: slide1, alt: "Young Soul Seekers" },
  { src: slide2, alt: "All The Time" },
  { src: slide3, alt: "Faith Shirt" },
  { src: slide4, alt: "God First" },
]

function Home() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [quotes, setQuotes] = useState([]) // State to hold quotes data
  const carouselRef = useRef(null)
  const featuresRef = useRef(null)
  const [isFeatureInView, setIsFeatureInView] = useState(false)

  // Auto-rotate main carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  // Fetch quotes from Firestore
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const fetchedQuotes = await getQuotesFromFirestore(); // Fetch quotes from Firestore
        setQuotes(fetchedQuotes);
      } catch (error) {
        console.error('Error fetching quotes:', error);
      }
    };

    fetchQuotes();
  }, []);

  // Setup intersection observer for scroll animations
  useEffect(() => {
    const options = {
      root: null, // Use the viewport as the root
      rootMargin: '0px',
      threshold: 0.2, // Trigger when 20% of the element is visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsFeatureInView(true);
        } else {
          setIsFeatureInView(false);
        }
      });
    }, options);

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => {
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, []);

  // Handle next quote
  const nextQuote = () => {
    if (isAnimating || quoteIndex >= quotes.length - 3) return;
    setIsAnimating(true);

    if (carouselRef.current) {
      carouselRef.current.style.transition = "transform 300ms ease-in-out";
      carouselRef.current.style.transform = "translateX(-33.33%)";
    }

    setTimeout(() => {
      setQuoteIndex(prevIndex => prevIndex + 1);

      if (carouselRef.current) {
        carouselRef.current.style.transition = "none";
        carouselRef.current.style.transform = "translateX(0)";
        carouselRef.current.offsetHeight;
      }

      setTimeout(() => {
        if (carouselRef.current) {
          carouselRef.current.style.transition = "transform 300ms ease-in-out";
        }
        setIsAnimating(false);
      }, 50);
    }, 300);
  }

  // Handle previous quote
  const prevQuote = () => {
    if (isAnimating || quoteIndex <= 0) return;
    setIsAnimating(true);

    if (carouselRef.current) {
      carouselRef.current.style.transition = "none";
      carouselRef.current.style.transform = "translateX(-33.33%)";
      carouselRef.current.offsetHeight;
      carouselRef.current.style.transition = "transform 300ms ease-in-out";
      carouselRef.current.style.transform = "translateX(0)";
    }

    setTimeout(() => {
      setQuoteIndex(prevIndex => prevIndex - 1);
      setIsAnimating(false);
    }, 300);
  }

  // Get the current visible quotes (3 by 3)
  const visibleQuotes = quotes.slice(quoteIndex, quoteIndex + 3);

  return (
    <div>
      {/* Main Carousel */}
      <div className="relative w-full h-[400px] overflow-hidden mt-10">
        {images.map((image, index) => (
          <img
            key={index}
            src={image.src || "/placeholder.svg"}
            alt={image.alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <button
          onClick={() => setCurrentIndex((currentIndex - 1 + images.length) % images.length)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
        >
          ❮
        </button>
        <button
          onClick={() => setCurrentIndex((currentIndex + 1) % images.length)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
        >
          ❯
        </button>
      </div>

      {/* Marquee Section */}
      <div className="w-full bg-black py-6 overflow-hidden">
        <div className="relative flex items-center whitespace-nowrap text-white text-2xl animate-marquee">
          <div className="flex">
            <span className="mx-8 font-cousine text-bold">WEAR GOD'S WORDS</span>
            <span className="mx-8 font-cousine text-bold">·</span>
            <span className="mx-8 font-cousine text-bold">WEAR GOD'S WORDS</span>
            <span className="mx-8 font-cousine text-bold">·</span>
            <span className="mx-8 font-cousine text-bold">WEAR GOD'S WORDS</span>
            <span className="mx-8 font-cousine text-bold">·</span>
            <span className="mx-8 font-cousine text-bold">WEAR GOD'S WORDS</span>
          </div>
          <div className="flex">
            <span className="mx-8 font-cousine text-bold">·</span>
            <span className="mx-8 font-cousine text-bold">WEAR GOD'S WORDS</span>
            <span className="mx-8 font-cousine text-bold">·</span>
            <span className="mx-8 font-cousine text-bold">WEAR GOD'S WORDS</span>
            <span className="mx-8 font-cousine text-bold">·</span>
            <span className="mx-8 font-cousine text-bold">WEAR GOD'S WORDS</span>
            <span className="mx-8 font-cousine text-bold">·</span>
            <span className="mx-8 font-cousine text-bold">WEAR GOD'S WORDS</span>
          </div>
        </div>
      </div>

      {/* Features Section with Scroll Animations */}
      <div className="w-full py-10 px-4 bg-[#FAFAFA]" ref={featuresRef}>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className={`text-3xl font-bold text-gray-900 mb-10 transition-all duration-700 ease-in-out ${isFeatureInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            FEATURES
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <div className={`relative group mb-6 transition-all duration-700 ease-in-out delay-100 ${isFeatureInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
                <img
                  src={premiumTeesImg || "/placeholder.svg"}
                  alt="PREMIUM TEES"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-white text-2xl font-bold mb-2 transition-transform duration-500 group-hover:translate-y-0 translate-y-4">PREMIUM TEES</h3>
                  <a href="/shop?category=premium%20tees" className="text-white underline text-sm tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                    Shop Now
                  </a>
                </div>
              </div>

              <div className={`relative group transition-all duration-700 ease-in-out delay-200 ${isFeatureInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
                <img src={basicTeesImg || "/placeholder.svg"} alt="BASIC TEES" className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-white text-2xl font-bold mb-2 transition-transform duration-500 group-hover:translate-y-0 translate-y-4">BASIC TEES</h3>
                  <a href="/shop?category=basic%20tees" className="text-white underline text-sm tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                    Shop Now
                  </a>
                </div>
              </div>
            </div>

            <div className={`relative group transition-all duration-700 ease-in-out delay-300 ${isFeatureInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
              <div className="relative w-full h-full">
                <img src={newProductsImg || "/placeholder.svg"} alt="NEW" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-white text-2xl font-bold mb-2 transition-transform duration-500 group-hover:translate-y-0 translate-y-4">NEW</h3>
                  <a href="/shop?category=new" className="text-white underline text-sm tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                    Shop Now
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-10 transition-all duration-700 ease-in-out delay-400 ${isFeatureInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}> 
            <a href="/shop" className="bg-black text-white py-4 px-10 rounded-lg font-medium text-sm border-2 border-black hover:bg-transparent hover:text-black transition-all duration-300"> 
              Shop All Products 
            </a> 
          </div>
        </div>
      </div>

      {/* Quote Carousel - Fixed with smooth animations */}
      <div className="relative w-full py-5 bg-gray-50">
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="relative overflow-hidden">
            <div
              ref={carouselRef}
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: "translateX(0)" }}
            >
              {visibleQuotes.map((quote, index) => (
                <div key={index} className="w-1/3 flex-shrink-0 px-2">
                  <div className="transform transition-all duration-300 hover:scale-105">
                    <img
                      src={quote.src || "/placeholder.svg"} // Dynamically render quotes from Firestore
                      alt={`Quote ${index + 1}`}
                      className="w-full h-auto object-contain rounded-lg shadow-md"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={prevQuote}
            disabled={isAnimating || quoteIndex === 0}
            className="absolute left-8 top-1/2 transform -translate-y-1/2 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-all duration-200 ease-in-out z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <button
            onClick={nextQuote}
            disabled={isAnimating || quoteIndex >= quotes.length - 3}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-all duration-200 ease-in-out z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: quotes.length - 2 }).map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  index === quoteIndex ? "bg-black scale-125" : "bg-gray-300"
                }`}
                onClick={() => !isAnimating && setQuoteIndex(index)}
                disabled={isAnimating}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home;