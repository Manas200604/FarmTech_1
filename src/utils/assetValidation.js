/**
 * Asset validation utility to ensure all required assets are available
 */

const REQUIRED_ASSETS = [
  '/images/logo.png',
  '/images/scanner-placeholder.svg'
];

/**
 * Check if an asset exists by attempting to load it
 * @param {string} assetPath - Path to the asset
 * @returns {Promise<boolean>} - True if asset exists, false otherwise
 */
export const checkAssetExists = async (assetPath) => {
  try {
    const response = await fetch(assetPath, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn(`Asset check failed for ${assetPath}:`, error);
    return false;
  }
};

/**
 * Validate all required assets
 * @returns {Promise<{valid: boolean, missing: string[]}>}
 */
export const validateRequiredAssets = async () => {
  const missing = [];
  
  for (const asset of REQUIRED_ASSETS) {
    const exists = await checkAssetExists(asset);
    if (!exists) {
      missing.push(asset);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
};

/**
 * Create a fallback image element for missing assets
 * @param {string} alt - Alt text for the image
 * @param {string} className - CSS classes
 * @returns {HTMLElement}
 */
export const createAssetFallback = (alt = 'Missing Asset', className = '') => {
  const div = document.createElement('div');
  div.className = `bg-gray-200 flex items-center justify-center ${className}`;
  div.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 19 20.1 19 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
    </svg>
    <span class="sr-only">${alt}</span>
  `;
  return div;
};

/**
 * Enhanced image component with fallback handling
 * @param {Object} props - Image properties
 * @returns {HTMLElement}
 */
export const createRobustImage = ({ src, alt, className, onLoad, onError }) => {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.className = className;
  
  img.onerror = (e) => {
    console.warn(`Failed to load image: ${src}`);
    const fallback = createAssetFallback(alt, className);
    img.parentNode?.replaceChild(fallback, img);
    if (onError) onError(e);
  };
  
  if (onLoad) {
    img.onload = onLoad;
  }
  
  return img;
};