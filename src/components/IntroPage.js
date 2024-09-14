import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { motion } from 'framer-motion'; // For adding animations

const sections = [
  {
    title: "Welcome to Your Scriptless API Automation Tool",
    description: "Our scriptless API automation tool offers a comprehensive solution to automate your testing workflow without writing a single line of code. Effortlessly upload your Postman or Swagger collections, generate dynamic test cases, and run tests with precision. Perfect for teams looking to accelerate their development and reduce manual testing efforts.",
    gif: "/images/hero-animation.webp",
  },
  {
    title: "Upload Your Postman Collection",
    description: "Upload Postman or Swagger collections in a few clicks, and start automating your API testing without delays. The tool parses your collections and sets up everything you need to begin testing immediately, saving you valuable time.",
    gif: "/images/Upload-PostmanCollection.webp",
  },
  {
    title: "Create a Project & Parse Data",
    description: "Create dedicated projects for better organization and parse data in real-time. This feature lets you set up test cases quickly, and ensures that your test data is ready when you are. Keep your projects clean and organized.",
    gif: "/images/project-creation.webp",
  },
  {
    title: "Generate Test Cases Automatically",
    description: "Our AI-powered engine analyzes your API collections and automatically generates test cases that cover edge cases and common scenarios. The tool ensures robust testing by providing a wide range of test cases to cover different parts of your API.",
    gif: "/images/test-case-generation.webp",
  },
  {
    title: "API Automation Execution",
    description: "Execute your API test cases automatically, ensuring that your API endpoints are functioning as expected. Get real-time feedback on the success and failure of your API requests, with detailed execution reports.",
    gif: "/images/execution.gif",
  },
  {
    title: "Analyze Results & Logs",
    description: "Get detailed execution logs, success/failure reports, and error analysis. With our tool, you'll have all the insights you need to understand your test results and refine your API further. Track, analyze, and improve based on real-time data.",
    gif: "/images/results-analysis.webp",
    showButton: true,  // Indicate that this is the last slide with the button
  },
];

const IntroPage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoSlide, setIsAutoSlide] = useState(false); // Auto slide flag
  const navigate = useNavigate(); // Hook to navigate between routes

  // UseEffect for auto-sliding, starts only after the first slide
  useEffect(() => {
    let interval;
    if (isAutoSlide && activeIndex !== 4) {
      interval = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex === sections.length - 1 ? 0 : prevIndex + 1));
      }, 15000); // 15 seconds interval for each slide
    }
    return () => clearInterval(interval);
  }, [isAutoSlide, activeIndex]);

  // Move to next slide and start auto-slide if it's the first slide
  const handleNextSlide = () => {
    if (activeIndex === 0) {
      setIsAutoSlide(true); // Start auto-slide after the first slide
    }
    setActiveIndex(activeIndex === sections.length - 1 ? 0 : activeIndex + 1);
  };

  // Move to previous slide
  const handlePrevSlide = () => {
    setActiveIndex(activeIndex === 0 ? sections.length - 1 : activeIndex - 1);
  };

  // Function to handle "Let's Get Started" button click
  const handleGetStarted = () => {
    navigate('/api-tool'); // Navigate to the ApiTool page
  };
  
  return (
    <div className="flex items-center justify-center w-full h-screen bg-gray-100">
      <div id="animation-carousel" className="relative w-full h-full overflow-hidden">
        {/* Carousel Wrapper */}
        <div className="relative w-full h-full">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              className={`duration-200 ease-linear transition-opacity absolute inset-0 flex items-center justify-between ${index === activeIndex ? 'block' : 'hidden'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              {/* Image on the left, description on the right */}
              <div className="md:w-1/2 w-full h-full flex items-center justify-center">
                <img
                  src={section.gif}
                  alt={section.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="md:w-1/2 w-full p-6 text-left bg-gray-50 shadow-lg">
                <motion.h1
                  className="text-xl md:text-3xl font-bold mb-4 text-blue-600"
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 100 }}
                >
                  {section.title}
                </motion.h1>
                <motion.p
                  className="text-md md:text-lg text-gray-700 mb-6 leading-relaxed"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
                >
                  {section.description}
                </motion.p>

                {/* Show "Let's Get Started" button only on the last slide */}
                {section.showButton && (
                  <motion.div
                    className="text-center mt-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button
                      className="bg-blue-600 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-700"
                      onClick={handleGetStarted}
                    >
                      Let's Get Started
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Slider controls */}
        <button
          type="button"
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-30 flex items-center justify-center h-12 w-12 bg-blue-600 hover:bg-blue-800 rounded-full cursor-pointer focus:outline-none"
          onClick={handlePrevSlide}
        >
          <svg
            className="w-6 h-6 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 6 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 1 1 5l4 4"
            />
          </svg>
          <span className="sr-only">Previous</span>
        </button>

        <button
          type="button"
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-30 flex items-center justify-center h-12 w-12 bg-blue-600 hover:bg-blue-800 rounded-full cursor-pointer focus:outline-none"
          onClick={handleNextSlide}
        >
          <svg
            className="w-6 h-6 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 6 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 9l4-4L1 1"
            />
          </svg>
          <span className="sr-only">Next</span>
        </button>
      </div>
    </div>
  );
};

export default IntroPage;
