import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, SlidersHorizontal, ShoppingBag, Heart, Package, X, Filter } from 'lucide-react';
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
  { value: '', label: 'All', emoji: '🛒' },
  { value: 'electronics', label: 'Electronics', emoji: '📱' },
  { value: 'vehicles', label: 'Vehicles', emoji: '🚗' },
  { value: 'fashion', label: 'Fashion', emoji: '👗' },
  { value: 'home', label: 'Home', emoji: '🏠' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'books', label: 'Books', emoji: '📚' },
  { value: 'toys', label: 'Toys', emoji: '🧸' },
  { value: 'other', label: 'Other', emoji: '📦' },
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

  const handleCategoryClick = (value) => {
    dispatch(setFilters({ category: filters.category === value ? '' : value }));
  };

  const hasActiveFilters = filters.category || filters.condition || filters.minPrice || filters.maxPrice || filters.query;

  const displayProducts =
    activeTab === 'browse' ? products : activeTab === 'my-listings' ? myListings : savedProducts;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Marketplace
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">Discover amazing deals near you</p>
            </div>
            {userData && (
              <button
                onClick={() => navigate('/marketplace/create')}
                className="flex items-center gap-2 bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Sell Item
              </button>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for anything..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-full bg-gray-100 dark:bg-gray-800 border-none text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-full transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Category Pills - Horizontal Scroll */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                className={`flex flex-col items-center gap-1 min-w-[72px] px-3 py-2 rounded-2xl text-xs font-medium transition-all ${
                  filters.category === cat.value || (!filters.category && !cat.value)
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
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
        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Filters</span>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    dispatch(resetFilters());
                    setSearchInput('');
                  }}
                  className="ml-auto text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 font-medium"
                >
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={filters.condition}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
                className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Min price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
              />

              <input
                type="number"
                placeholder="Max price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
              />

              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 py-5">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 animate-pulse" />
                <div className="p-3.5 space-y-2.5">
                  <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-lg w-24 animate-pulse" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-lg w-full animate-pulse" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-lg w-20 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {activeTab === 'browse' ? (
                <ShoppingBag className="w-9 h-9 text-gray-300 dark:text-gray-600" />
              ) : activeTab === 'my-listings' ? (
                <Package className="w-9 h-9 text-gray-300 dark:text-gray-600" />
              ) : (
                <Heart className="w-9 h-9 text-gray-300 dark:text-gray-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {activeTab === 'browse'
                ? 'No products found'
                : activeTab === 'my-listings'
                  ? "You haven't listed anything yet"
                  : 'No saved products'}
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              {activeTab === 'browse'
                ? 'Try adjusting your filters or search'
                : activeTab === 'my-listings'
                  ? 'Start selling by listing your first item'
                  : 'Save products you like to find them later'}
            </p>
            {activeTab === 'browse' && hasActiveFilters && (
              <button
                onClick={() => { dispatch(resetFilters()); setSearchInput(''); }}
                className="inline-flex items-center gap-1.5 bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
            {activeTab === 'my-listings' && userData && (
              <button
                onClick={() => navigate('/marketplace/create')}
                className="inline-flex items-center gap-1.5 bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> List an Item
              </button>
            )}
          </div>
        ) : (
          <>
            {activeTab === 'browse' && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-gray-600 dark:text-gray-300">{total}</span> products found
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} isOwner={activeTab === 'my-listings'} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
