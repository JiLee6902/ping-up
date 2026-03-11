import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, SlidersHorizontal, ShoppingBag, Heart, Package, X } from 'lucide-react';
import {
  fetchProducts,
  fetchMyListings,
  fetchSavedProducts,
  fetchCategories,
  setFilters,
  resetFilters,
} from '../../features/marketplace/marketplaceSlice';
import ProductCard from './ProductCard';

const TABS = [
  { id: 'browse', label: 'Browse', icon: ShoppingBag },
  { id: 'my-listings', label: 'My Listings', icon: Package },
  { id: 'saved', label: 'Saved', icon: Heart },
];

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports' },
  { value: 'books', label: 'Books' },
  { value: 'toys', label: 'Toys' },
  { value: 'other', label: 'Other' },
];

const CONDITIONS = [
  { value: '', label: 'Any Condition' },
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'most_viewed', label: 'Most Viewed' },
];

export default function Marketplace() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, myListings, savedProducts, filters, loading, total } = useSelector(
    (state) => state.marketplace,
  );
  const { userData } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState('browse');
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'browse') {
      dispatch(fetchProducts(filters));
    } else if (activeTab === 'my-listings') {
      dispatch(fetchMyListings());
    } else if (activeTab === 'saved') {
      dispatch(fetchSavedProducts());
    }
  }, [dispatch, activeTab, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ query: searchInput }));
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const displayProducts =
    activeTab === 'browse' ? products : activeTab === 'my-listings' ? myListings : savedProducts;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-6 h-6" />
              Marketplace
            </h1>
            {userData && (
              <button
                onClick={() => navigate('/marketplace/create')}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Sell Item
              </button>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search marketplace..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border ${
                showFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-600'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </form>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={filters.condition}
              onChange={(e) => handleFilterChange('condition', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Min price"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />

            <input
              type="number"
              placeholder="Max price"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="max-w-6xl mx-auto mt-2 flex justify-end">
            <button
              onClick={() => {
                dispatch(resetFilters());
                setSearchInput('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl h-72 animate-pulse"
              />
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {activeTab === 'browse'
                ? 'No products found'
                : activeTab === 'my-listings'
                  ? 'You haven\'t listed anything yet'
                  : 'No saved products'}
            </p>
            {activeTab === 'browse' && (
              <button
                onClick={() => {
                  dispatch(resetFilters());
                  setSearchInput('');
                }}
                className="mt-3 text-blue-600 hover:text-blue-700 text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {activeTab === 'browse' && (
              <p className="text-sm text-gray-500 mb-3">{total} products found</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isOwner={activeTab === 'my-listings'}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
