import { useState, useEffect, useRef, useCallback } from 'react';
import { VirtualScroller } from '../../utils/performanceOptimization';
import { useImageOptimization } from '../../hooks/useImageOptimization.jsx';

const VirtualProductList = ({ 
  products, 
  itemHeight = 200, 
  containerHeight = 600,
  onProductClick,
  onAddToCart,
  renderProduct
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const { LazyImage } = useImageOptimization();
  
  const virtualScroller = new VirtualScroller(containerHeight, itemHeight, 3);
  const { startIndex, endIndex } = virtualScroller.getVisibleRange(scrollTop, products.length);
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  const visibleProducts = products.slice(startIndex, endIndex + 1);

  const DefaultProductRenderer = ({ product, index, style }) => (
    <div style={style} className="p-4 border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <LazyImage
          src={product.imageUrl}
          alt={product.getLocalizedName('en')}
          width={80}
          height={80}
          className="rounded-lg"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {product.getLocalizedName('en')}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {product.getLocalizedDescription('en')}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-bold text-primary-600">
              ₹{product.price}
            </span>
            <button
              onClick={() => onAddToCart(product)}
              className="px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={virtualScroller.getContainerStyle(products.length)}>
        {visibleProducts.map((product, index) => {
          const actualIndex = startIndex + index;
          const style = virtualScroller.getItemStyle(actualIndex);
          
          if (renderProduct) {
            return renderProduct({ product, index: actualIndex, style });
          }
          
          return (
            <DefaultProductRenderer
              key={product.id}
              product={product}
              index={actualIndex}
              style={style}
            />
          );
        })}
      </div>
    </div>
  );
};

export default VirtualProductList;