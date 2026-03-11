import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  ShoppingCart,
  MapPin,
  Eye,
  Star,
  ChevronLeft,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { fetchProductDetail, toggleSaveProduct, clearCurrentProduct } from '../../features/marketplace/marketplaceSlice';

const CONDITION_LABELS = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const CATEGORY_LABELS = {
  electronics: 'Electronics',
  vehicles: 'Vehicles',
  fashion: 'Fashion',
  home: 'Home & Garden',
  sports: 'Sports',
  books: 'Books',
  toys: 'Toys',
  other: 'Other',
};

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const images = product.imageUrls || [];
  const isOwner = userData?.id === product.seller?.id;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{product.title}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Carousel */}
          <div className="relative">
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
              {images[currentImage] ? (
                <img
                  src={images[currentImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Thumbnails */}
                <div className="flex gap-2 mt-3">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        i === currentImage ? 'border-blue-500' : 'border-transparent'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Product Info */}
          <div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatPrice(product.price)}
            </p>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">
              {product.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-gray-500">
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {CATEGORY_LABELS[product.category] || product.category}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                {CONDITION_LABELS[product.condition] || product.condition}
              </span>
              {product.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {product.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {product.viewsCount} views
              </span>
              <span>{timeAgo(product.createdAt)}</span>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {!isOwner && userData && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => navigate(`/messages/${product.seller?.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message Seller
                </button>
                <button
                  onClick={() => dispatch(toggleSaveProduct(product.id))}
                  className={`p-2.5 rounded-lg border ${
                    product.isSaved
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'border-gray-300 dark:border-gray-600 text-gray-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${product.isSaved ? 'fill-red-500' : ''}`} />
                </button>
                <button className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Seller Card */}
            {product.seller && (
              <div
                onClick={() => navigate(`/marketplace/seller/${product.seller.id}`)}
                className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <img
                  src={product.seller.profilePicture || '/default-avatar.png'}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {product.seller.fullName}
                  </p>
                  <p className="text-sm text-gray-500">@{product.seller.username}</p>
                  {product.seller.avgRating > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {product.seller.avgRating.toFixed(1)} ({product.seller.totalReviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
