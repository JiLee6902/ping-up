import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Eye, MapPin, MoreVertical, Trash2, CheckCircle, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { toggleSaveProduct, deleteProduct, markAsSold } from '../../features/marketplace/marketplaceSlice';
import LoginPrompt from '../../components/LoginPrompt';

const CONDITION_LABELS = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const CONDITION_COLORS = {
  new: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  like_new: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  good: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  fair: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  poor: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);

  const handleSave = (e) => {
    e.stopPropagation();
    if (!userData) { setLoginPrompt(true); return; }
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
      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 transition-all duration-300 cursor-pointer group hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
        {product.imageUrls?.[0] ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse" />
            )}
            <img
              src={product.imageUrls[0]}
              alt={product.title}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out ${isSold ? 'opacity-40 grayscale' : ''} ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
            <ShoppingBag className="w-10 h-10" />
          </div>
        )}

        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-gray-900/80 text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wide backdrop-blur-sm">
              SOLD
            </span>
          </div>
        )}

        {/* Save button */}
        {!isOwner && (
          <button
            onClick={handleSave}
            className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 shadow-sm hover:shadow-md transition-all hover:scale-110"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${product.isSaved ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`}
            />
          </button>
        )}

        {/* Owner menu */}
        {isOwner && (
          <div className="absolute top-2.5 right-2.5">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:bg-white shadow-sm"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 min-w-[150px] z-20 overflow-hidden">
                {!isSold && (
                  <button
                    onClick={handleMarkSold}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark as Sold
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* Condition badge */}
        <span
          className={`absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm ${CONDITION_COLORS[product.condition] || 'bg-gray-100 text-gray-700'}`}
        >
          {CONDITION_LABELS[product.condition] || product.condition}
        </span>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className={`text-lg font-bold tracking-tight ${isSold ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
          {formatPrice(product.price)}
        </p>
        <h3 className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-0.5">
          {product.title}
        </h3>

        <div className="flex items-center justify-between mt-2.5">
          {product.location && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{product.location}</span>
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-300 dark:text-gray-600 ml-auto">
            <Eye className="w-3 h-3" />
            {product.viewsCount || 0}
          </span>
        </div>

        {/* Seller */}
        {product.seller && !isOwner && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
            <img
              src={product.seller.profilePicture || '/default-avatar.png'}
              alt=""
              className="w-6 h-6 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
            />
            <span className="text-xs text-gray-400 truncate">{product.seller.fullName}</span>
          </div>
        )}
      </div>

      {loginPrompt && (
        <LoginPrompt message="Log in to save products." onClose={() => setLoginPrompt(false)} />
      )}
    </div>
  );
}
