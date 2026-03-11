import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Star, MessageCircle } from 'lucide-react';
import { fetchSellerProfile, createReview } from '../../features/marketplace/marketplaceSlice';
import ProductCard from './ProductCard';

export default function SellerProfile() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { sellerProfile } = useSelector((state) => state.marketplace);
  const { userData } = useSelector((state) => state.user);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    dispatch(fetchSellerProfile(sellerId));
  }, [dispatch, sellerId]);

  const handleSubmitReview = async () => {
    await dispatch(
      createReview({
        sellerId,
        rating: reviewRating,
        comment: reviewComment,
      }),
    );
    setShowReviewForm(false);
    setReviewComment('');
    dispatch(fetchSellerProfile(sellerId));
  };

  if (!sellerProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const { seller, products } = sellerProfile;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Seller Profile</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Seller Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center gap-4 mb-6">
          <img
            src={seller.profilePicture || '/default-avatar.png'}
            alt=""
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{seller.fullName}</h2>
            <p className="text-gray-500">@{seller.username}</p>
            {seller.avgRating > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(seller.avgRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                  {seller.avgRating.toFixed(1)} ({seller.totalReviews} reviews)
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {userData && userData.id !== sellerId && (
              <>
                <button
                  onClick={() => navigate(`/messages/${sellerId}`)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Star className="w-4 h-4" />
                  Review
                </button>
              </>
            )}
          </div>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Write a Review</h3>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setReviewRating(s)}>
                  <Star
                    className={`w-6 h-6 ${
                      s <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none mb-3"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {/* Products */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Listings ({products.length})
        </h3>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No active listings</p>
        )}
      </div>
    </div>
  );
}
