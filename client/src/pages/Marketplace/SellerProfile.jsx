import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Star, MessageCircle, MapPin, ShieldCheck, Calendar, Package } from 'lucide-react';
import { fetchSellerProfile, createReview } from '../../features/marketplace/marketplaceSlice';
import ProductCard from './ProductCard';

function timeAgo(date) {
  const now = new Date();
  const d = new Date(date);
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (months < 1) return 'This month';
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export default function SellerProfile() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { sellerProfile } = useSelector((state) => state.marketplace);
  const { userData } = useSelector((state) => state.user);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchSellerProfile(sellerId));
  }, [dispatch, sellerId]);

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) return;
    setSubmitting(true);
    await dispatch(createReview({ sellerId, rating: reviewRating, comment: reviewComment }));
    setSubmitting(false);
    setShowReviewForm(false);
    setReviewComment('');
    dispatch(fetchSellerProfile(sellerId));
  };

  if (!sellerProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  const { seller, products } = sellerProfile;
  const isOwnProfile = userData?.id === sellerId;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Seller Profile</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Seller Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
          {/* Cover gradient */}
          <div className="h-24 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800" />

          <div className="px-6 pb-6 -mt-10">
            <div className="flex items-end gap-4 mb-4">
              <img
                src={seller.profilePicture || '/default-avatar.png'}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-900 shadow-lg"
              />
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{seller.fullName}</h2>
                  {seller.isVerified && (
                    <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-gray-400 text-sm">@{seller.username}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-5">
              {seller.avgRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(seller.avgRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200 dark:text-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {seller.avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-400">
                    ({seller.totalReviews} review{seller.totalReviews !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
              {seller.location && (
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <MapPin className="w-3.5 h-3.5" />
                  {seller.location}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            {userData && !isOwnProfile && (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/messages/${sellerId}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-white py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message Seller
                </button>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Star className="w-4 h-4" />
                  Review
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Write a Review</h3>

            {/* Star Rating */}
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setReviewRating(s)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm text-gray-400 ml-2">
                {reviewRating === 5 ? 'Excellent' : reviewRating === 4 ? 'Good' : reviewRating === 3 ? 'Average' : reviewRating === 2 ? 'Poor' : 'Terrible'}
              </span>
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this seller..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 resize-none mb-4 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowReviewForm(false); setReviewComment(''); }}
                className="px-5 py-2.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submitting || !reviewComment.trim()}
                className="px-5 py-2.5 text-sm bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}

        {/* Products */}
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Listings
          </h3>
          <span className="text-sm text-gray-400 font-normal">({products.length})</span>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Package className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-gray-400">No active listings</p>
          </div>
        )}
      </div>
    </div>
  );
}
