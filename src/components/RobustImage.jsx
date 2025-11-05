import React, { useState } from 'react';

/**
 * RobustImage component with fallback handling for missing assets
 */
const RobustImage = ({ 
  src, 
  alt = 'Image', 
  className = '', 
  fallbackClassName = '',
  onLoad,
  onError,
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = (e) => {
    setIsLoading(false);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    console.warn(`Failed to load image: ${src}`);
    setHasError(true);
    setIsLoading(false);
    if (onError) onError(e);
  };

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${fallbackClassName || className}`}
        {...props}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-400"
        >
          <path 
            d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 19 20.1 19 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" 
            fill="currentColor"
          />
        </svg>
        <span className="sr-only">{alt}</span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`bg-gray-100 animate-pulse ${className}`} {...props}>
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </>
  );
};

export default RobustImage;