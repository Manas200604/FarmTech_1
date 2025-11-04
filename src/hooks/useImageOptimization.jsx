import { useState, useEffect, useCallback } from 'react';

export const useImageOptimization = () => {
  const [imageCache, setImageCache] = useState(new Map());
  const [loadingImages, setLoadingImages] = useState(new Set());

  const optimizeImageUrl = useCallback((url, width = 400, height = 300, quality = 80) => {
    if (!url) return '';
    
    // For external URLs, try to add optimization parameters
    if (url.includes('unsplash.com')) {
      return `${url}?w=${width}&h=${height}&q=${quality}&fit=crop`;
    }
    
    if (url.includes('images.unsplash.com')) {
      const baseUrl = url.split('?')[0];
      return `${baseUrl}?w=${width}&h=${height}&q=${quality}&fit=crop&auto=format`;
    }
    
    // For other URLs, return as-is
    return url;
  }, []);

  const preloadImage = useCallback((url) => {
    return new Promise((resolve, reject) => {
      if (imageCache.has(url)) {
        resolve(imageCache.get(url));
        return;
      }

      if (loadingImages.has(url)) {
        // Already loading, wait for it
        const checkLoading = () => {
          if (!loadingImages.has(url)) {
            resolve(imageCache.get(url));
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
        return;
      }

      setLoadingImages(prev => new Set(prev).add(url));

      const img = new Image();
      img.onload = () => {
        setImageCache(prev => new Map(prev).set(url, url));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
        resolve(url);
      };
      img.onerror = () => {
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(url);
          return newSet;
        });
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  }, [imageCache, loadingImages]);

  const LazyImage = useCallback(({ 
    src, 
    alt, 
    className = '', 
    width = 400, 
    height = 300, 
    quality = 80,
    placeholder = 'bg-gray-200',
    ...props 
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [imgRef, setImgRef] = useState(null);

    const optimizedSrc = optimizeImageUrl(src, width, height, quality);

    useEffect(() => {
      if (!imgRef) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(imgRef);
      return () => observer.disconnect();
    }, [imgRef]);

    useEffect(() => {
      if (isInView && optimizedSrc) {
        preloadImage(optimizedSrc)
          .then(() => setIsLoaded(true))
          .catch(console.error);
      }
    }, [isInView, optimizedSrc, preloadImage]);

    return (
      <div
        ref={setImgRef}
        className={`relative overflow-hidden ${className}`}
        style={{ width, height }}
        {...props}
      >
        {!isLoaded && (
          <div className={`absolute inset-0 ${placeholder} animate-pulse flex items-center justify-center`}>
            <div className="text-gray-400 text-sm">Loading...</div>
          </div>
        )}
        {isInView && (
          <img
            src={optimizedSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={() => setIsLoaded(true)} // Show broken image instead of loading
          />
        )}
      </div>
    );
  }, [optimizeImageUrl, preloadImage]);

  const preloadImages = useCallback(async (urls) => {
    const promises = urls.map(url => preloadImage(url).catch(() => null));
    return Promise.allSettled(promises);
  }, [preloadImage]);

  const clearImageCache = useCallback(() => {
    setImageCache(new Map());
  }, []);

  return {
    optimizeImageUrl,
    preloadImage,
    preloadImages,
    LazyImage,
    clearImageCache,
    cacheSize: imageCache.size,
    isLoading: (url) => loadingImages.has(url),
    isCached: (url) => imageCache.has(url)
  };
};