import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Heart, MessageCircle, MapPin, Eye, Star,
  ChevronLeft, ChevronRight, Share2, ShieldCheck, Clock, Tag,
} from 'lucide-react';
import { fetchProductDetail, toggleSaveProduct, clearCurrentProduct } from '../../features/marketplace/marketplaceSlice';

const CONDITION_LABELS = {
  new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair', poor: 'Poor',
};

const CATEGORY_LABELS = {
  electronics: 'Electronics', vehicles: 'Vehicles', fashion: 'Fashion',
  home: 'Home & Garden', sports: 'Sports', books: 'Books', toys: 'Toys', other: 'Other',
};

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(price);
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString('vi-VN');
}

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentProduct: product, detailLoading } = useSelector((state) => state.marketplace);
  const { userData } = useSelector((state) => state.user);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    dispatch(fetchProductDetail(productId));
    return () => dispatch(clearCurrentProduct());
  }, [dispatch, productId]);

  if (detailLoading || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  const images = product.imageUrls || [];
  const isOwner = userData?.id === product.seller?.id;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">{product.title}</h1>
          <button onClick={handleShare} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <Share2 className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Images */}
          <div className="lg:col-span-3">
            {/* Main Image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 group">
              {images[currentImage] ? (
                <img
                  src={images[currentImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">No image</div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((p) => (p === 0 ? images.length - 1 : p - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => setCurrentImage((p) => (p === images.length - 1 ? 0 : p + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>

                  {/* Image counter */}
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
                    {currentImage + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden transition-all ${
                      i === currentImage
                        ? 'ring-2 ring-gray-900 dark:ring-white ring-offset-2 dark:ring-offset-gray-950'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description - on large screens, below images */}
            {product.description && (
              <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hidden lg:block">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Price & Title Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {formatPrice(product.price)}
              </p>
              <h2 className="text-base text-gray-600 dark:text-gray-400 mt-1.5">
                {product.title}
              </h2>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
                  <Tag className="w-3 h-3" />
                  {CATEGORY_LABELS[product.category] || product.category}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                  {CONDITION_LABELS[product.condition] || product.condition}
                </span>
                {product.location && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
                    <MapPin className="w-3 h-3" />
                    {product.location}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {product.viewsCount} views
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo(product.createdAt)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            {!isOwner && userData && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/messages/${product.seller?.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-white py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message Seller
                </button>
                <button
                  onClick={() => dispatch(toggleSaveProduct(product.id))}
                  className={`p-3.5 rounded-xl border transition-all ${
                    product.isSaved
                      ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-500'
                      : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${product.isSaved ? 'fill-rose-500' : ''}`} />
                </button>
              </div>
            )}

            {/* Seller Card */}
            {product.seller && (
              <div
                onClick={() => navigate(`/marketplace/seller/${product.seller.id}`)}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3.5 cursor-pointer hover:shadow-md transition-all group"
              >
                <img
                  src={product.seller.profilePicture || '/default-avatar.png'}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {product.seller.fullName}
                    </p>
                    {product.seller.isVerified && (
                      <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">@{product.seller.username}</p>
                  {product.seller.avgRating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-gray-500">
                        {product.seller.avgRating.toFixed(1)} ({product.seller.totalReviews})
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            )}

            {/* Description - on mobile, show here */}
            {product.description && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 lg:hidden">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
