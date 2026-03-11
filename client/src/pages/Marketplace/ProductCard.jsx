import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Eye, MapPin, MoreVertical, Trash2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toggleSaveProduct, deleteProduct, markAsSold } from '../../features/marketplace/marketplaceSlice';

const CONDITION_LABELS = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const CONDITION_COLORS = {
  new: 'bg-green-100 text-green-700',
  like_new: 'bg-blue-100 text-blue-700',
  good: 'bg-yellow-100 text-yellow-700',
  fair: 'bg-orange-100 text-orange-700',
  poor: 'bg-red-100 text-red-700',
};

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ProductCard({ product, isOwner = false }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const [showMenu, setShowMenu] = useState(false);

  const handleSave = (e) => {
    e.stopPropagation();
    if (!userData) return;
    dispatch(toggleSaveProduct(product.id));
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this product?')) {
      dispatch(deleteProduct(product.id));
    }
    setShowMenu(false);
  };

  const handleMarkSold = (e) => {
    e.stopPropagation();
    dispatch(markAsSold(product.id));
    setShowMenu(false);
  };

  const isSold = product.status === 'sold';

  return (
    <div
      onClick={() => navigate(`/marketplace/${product.id}`)}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer group relative"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        {product.imageUrls?.[0] ? (
          <img
            src={product.imageUrls[0]}
            alt={product.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isSold ? 'opacity-50' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}

        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              SOLD
            </span>
          </div>
        )}

        {/* Save button */}
        {!isOwner && userData && (
          <button
            onClick={handleSave}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white shadow-sm transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${product.isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        )}

        {/* Owner menu */}
        {isOwner && (
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white shadow-sm"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[140px] z-20">
                {!isSold && (
                  <button
                    onClick={handleMarkSold}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark as Sold
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* Condition badge */}
        <span
          className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${CONDITION_COLORS[product.condition] || 'bg-gray-100 text-gray-700'}`}
        >
          {CONDITION_LABELS[product.condition] || product.condition}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
          {formatPrice(product.price)}
        </p>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mt-0.5">
          {product.title}
        </h3>

        <div className="flex items-center justify-between mt-2">
          {product.location && (
            <span className="flex items-center gap-0.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              {product.location}
            </span>
          )}
          <span className="flex items-center gap-0.5 text-xs text-gray-400">
            <Eye className="w-3 h-3" />
            {product.viewsCount || 0}
          </span>
        </div>

        {/* Seller */}
        {product.seller && !isOwner && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <img
              src={product.seller.profilePicture || '/default-avatar.png'}
              alt=""
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-xs text-gray-500 truncate">{product.seller.fullName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
