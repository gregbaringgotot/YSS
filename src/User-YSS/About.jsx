import React, { useEffect, useRef } from 'react';
import backgroundpicture from '../../src/assets/About-Images/BackgroundAboutUsimage.png';

function About() {
  // Create refs for elements we want to animate
  const aboutTitleRef = useRef(null);
  const aboutTextsRef = useRef([]);
  const missionSectionRef = useRef(null);
  const missionTitleRef = useRef(null);
  const missionTextRef = useRef(null);
  const visionTitleRef = useRef(null);
  const visionTextRef = useRef(null);

  useEffect(() => {
    // Set up the Intersection Observer
    const observerOptions = {
      root: null, // Use the viewport as the root
      rootMargin: '0px', // No margin
      threshold: 0.1, // Trigger when at least 10% of the element is visible
    };

    const handleIntersection = (entries, observer) => {
      entries.forEach(entry => {
        // Add or remove the 'visible' class based on intersection
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          entry.target.classList.remove('visible');
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Observe all refs
    if (aboutTitleRef.current) observer.observe(aboutTitleRef.current);
    aboutTextsRef.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });
    if (missionSectionRef.current) observer.observe(missionSectionRef.current);
    if (missionTitleRef.current) observer.observe(missionTitleRef.current);
    if (missionTextRef.current) observer.observe(missionTextRef.current);
    if (visionTitleRef.current) observer.observe(visionTitleRef.current);
    if (visionTextRef.current) observer.observe(visionTextRef.current);

    // Clean up the observer on component unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  // Function to add refs to the aboutTextsRef array
  const addToAboutTextsRef = (el) => {
    if (el && !aboutTextsRef.current.includes(el)) {
      aboutTextsRef.current.push(el);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-9">
      {/* Main Wrapper to Center Content */}
      <div className="mx-auto">
        {/* About Us Section */}
        <div className="py-16 px-6 lg:px-24">
          <div className="text-center">
            <h1 
              ref={aboutTitleRef} 
              className="text-4xl font-bold text-gray-800 uppercase mb-6 font-cousine transition-opacity duration-700 opacity-0 transform translate-y-8"
            >
              About Us
            </h1>
            <p 
              ref={addToAboutTextsRef} 
              className="text-lg text-gray-700 leading-relaxed mb-6 font-poppins transition-opacity duration-700 opacity-0 transform translate-y-8 delay-100"
            >
              <span className="italic">Welcome to Young Soul Seekers</span> – At Young Soul Seekers, we believe that faith and fashion go hand in hand. Our mission is to inspire, empower, and uplift individuals through clothing that reflects God's love and teachings. Each piece in our collection is thoughtfully designed to carry messages of hope, encouragement, and strength, making it more than just apparel—it's a testament of faith.
            </p>
            <p 
              ref={addToAboutTextsRef} 
              className="text-lg text-gray-700 leading-relaxed mb-6 font-poppins transition-opacity duration-700 opacity-0 transform translate-y-8 delay-200"
            >
              Our tagline, <span className="font-semibold">"Confidently Wear God's Word"</span>, captures the essence of what we stand for. We want our customers to feel confident not only in their style but also in their identity as followers of Christ.
            </p>
            <p 
              ref={addToAboutTextsRef} 
              className="text-lg text-gray-700 leading-relaxed font-poppins transition-opacity duration-700 opacity-0 transform translate-y-8 delay-300"
            >
              Thank you for being part of our journey. Together, let's confidently wear God's Word and make a difference, one outfit at a time!
            </p>
          </div>
        </div>

        {/* Mission and Vision Section */}
        <div 
          ref={missionSectionRef}
          className="relative w-full py-16 mb-10 transition-opacity duration-700 opacity-0"
        >
          {/* Background Image with Darker Overlay */}
          <div className="absolute inset-0 w-full h-full z-0 ">
            <img
              src={backgroundpicture}
              alt="Mission and Vision Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black opacity-50"></div> {/* Darker overlay */}
          </div>

          {/* Content Centered */}
          <div className="relative z-10 max-w-screen-xl mx-auto px-6 lg:px-24 grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="text-center">
              <h2 
                ref={missionTitleRef}
                className="text-2xl font-bold uppercase mb-4 text-white font-cousine transition-opacity duration-700 opacity-0 transform translate-y-8 delay-100"
              >
                Our Mission
              </h2>
              <p 
                ref={missionTextRef}
                className="text-lg leading-relaxed text-white italic transition-opacity duration-700 opacity-0 transform translate-y-8 delay-200"
              >
                Young Soul Seekers exists to inspire and uplift through faith-driven apparel that reflects God's love. We aim to create clothing that empowers individuals to boldly live out their beliefs while spreading messages of hope, strength, and encouragement.
              </p>
            </div>
            {/* Vision */}
            <div className="text-center">
              <h2 
                ref={visionTitleRef}
                className="text-2xl font-bold uppercase mb-4 text-white font-cousine transition-opacity duration-700 opacity-0 transform translate-y-8 delay-300"
              >
                Our Vision
              </h2>
              <p 
                ref={visionTextRef}
                className="text-lg leading-relaxed text-white italic transition-opacity duration-700 opacity-0 transform translate-y-8 delay-400"
              >
                We strive to be a faith-based brand that bridges fashion and faith, empowering individuals to confidently wear God's Word. Our vision is to inspire a movement of positivity and Gospel-centered living, touching lives one design at a time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>
        {`
          .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }
        `}
      </style>
    </div>
  );
}

export default About;
