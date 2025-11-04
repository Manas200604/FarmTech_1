import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/FastAuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { Button } from '../ui/Button';
import LanguageSelector from '../ui/LanguageSelector';
import { 
  Menu, 
  X, 
  Home, 
  Upload, 
  FileText, 
  Users, 
  Settings,
  LogOut,
  Leaf,
  MessageSquare,
  ShoppingCart
} from 'lucide-react';

const Navbar = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { t } = useLanguage();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = currentUser ? (
    userProfile?.role === 'admin' ? [
      { name: t('dashboard'), path: '/admin', icon: Home },
      { name: t('materials'), path: '/materials', icon: MessageSquare },
      { name: t('schemes'), path: '/schemes', icon: FileText },
      { name: t('contacts'), path: '/contacts', icon: Users },
      { name: t('treatments'), path: '/treatments', icon: Settings },
    ] : [
      { name: t('dashboard'), path: '/dashboard', icon: Home },
      { name: t('upload'), path: '/materials', icon: Upload },
      { name: t('materials'), path: '/materials', icon: MessageSquare },
      { name: t('schemes'), path: '/schemes', icon: FileText },
      { name: t('contacts'), path: '/contacts', icon: Users },
    ]
  ) : [];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/images/logo.png" 
                alt="FarmTech Logo" 
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  // Fallback to leaf icon if logo fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'inline-block';
                }}
              />
              <Leaf className="h-8 w-8 text-primary-500" style={{ display: 'none' }} />
              <span className="text-xl font-bold text-gray-900">FarmTech</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* Cart Icon for non-admin users */}
            {currentUser && userProfile?.role !== 'admin' && (
              <Link
                to="/cart"
                className="relative flex items-center space-x-1 text-gray-600 hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}
            
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              {currentUser ? (
                <>
                  <span className="text-sm text-gray-600">
                    {t('welcome')}, {userProfile?.name || currentUser.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('logout')}</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm">{t('login')}</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">{t('register')}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-500 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Cart Link for non-admin users */}
              {currentUser && userProfile?.role !== 'admin' && (
                <Link
                  to="/cart"
                  className="relative flex items-center space-x-2 text-gray-600 hover:text-primary-500 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>{t('cart', 'Cart')}</span>
                  {itemCount > 0 && (
                    <span className="bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-auto">
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}
              
              <div className="border-t border-gray-200 pt-4 pb-3">
                <div className="px-3 mb-3">
                  <LanguageSelector />
                </div>
                {currentUser ? (
                  <>
                    <div className="px-3 mb-3">
                      <p className="text-sm text-gray-600">
                        {t('welcome')}, {userProfile?.name || currentUser.email}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="mx-3 flex items-center space-x-1"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t('logout')}</span>
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="mx-3 w-full">
                        {t('login')}
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button size="sm" className="mx-3 w-full">
                        {t('register')}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;