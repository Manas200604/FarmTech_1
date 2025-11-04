import { ShoppingCart, Package } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const TabNavigation = ({ activeTab, onTabChange, cartItemCount = 0 }) => {
  const { t } = useLanguage();

  const tabs = [
    {
      id: 'materials',
      label: t('materials'),
      icon: Package,
    },
    {
      id: 'cart',
      label: t('cart'),
      icon: ShoppingCart,
      badge: cartItemCount > 0 ? cartItemCount : null,
    },
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTabChange(tab.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onTabChange(tab.id);
                  }
                }}
                className={`
                  relative flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  ${isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
                tabIndex={0}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;