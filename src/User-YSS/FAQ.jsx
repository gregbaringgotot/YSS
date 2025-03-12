import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    { question: "What is Young Soul Seekers?", answer: "Young Soul Seekers is a Christian clothing brand that promotes faith and inspiration through its apparel." },
    { question: "How can I place an order?", answer: "You can place an order through our website by selecting your items, adding them to your cart, and checking out." },
    { question: "Do you accept online payments?", answer: "Currently, we do not accept online payments. Orders are finalized through personal contact for payment arrangements." },
    { question: "What sizes do you offer?", answer: "We offer a variety of sizes. Please check our Size Chart for detailed measurements." },
    { question: "Do you ship nationwide?", answer: "Currently, we do not ship nationwide as we are a small business just starting out. We hope to offer this service in the future." },
    { question: "How long does shipping take?", answer: "Shipping usually takes 3-7 business days, depending on your location." },
    { question: "Can I return or exchange items?", answer: "Yes, we allow returns and exchanges for defective or incorrect items. Please contact us within 7 days of receiving your order." },
    { question: "Do you restock sold-out items?", answer: "Yes, we restock popular designs, but availability may vary. Follow our social media pages for updates." },
    { question: "Can I customize my shirt?", answer: "Currently, we do not offer customization, but we may introduce this in the future." },
    { question: "How can I contact you for inquiries?", answer: "You can reach us through the Contact section on our website or via email and phone listed there." }
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12 text-gray-800 font-cousine mt-10">
          Frequently Asked Questions
        </h1>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-white shadow-md rounded-lg mb-4 overflow-hidden transition-all duration-300"
            >
              <button 
                onClick={() => toggleFAQ(index)}
                className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-800 font-cousine">
                  {faq.question}
                </span>
                {activeIndex === index ? (
                  <ChevronUp className="text-gray-600" />
                ) : (
                  <ChevronDown className="text-gray-600" />
                )}
              </button>

              {activeIndex === index && (
                <div 
                  className={`px-6 pb-6 text-gray-700 animate-fadeInUp delay-${index + 1}`}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FAQ;
