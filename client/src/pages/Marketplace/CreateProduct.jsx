import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft, Upload, X, ImagePlus, Camera } from 'lucide-react';
import { createProduct } from '../../features/marketplace/marketplaceSlice';

const CATEGORIES = [
  { value: 'electronics', label: 'Electronics', emoji: '📱' },
  { value: 'vehicles', label: 'Vehicles', emoji: '🚗' },
  { value: 'fashion', label: 'Fashion', emoji: '👗' },
  { value: 'home', label: 'Home & Garden', emoji: '🏠' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'books', label: 'Books', emoji: '📚' },
  { value: 'toys', label: 'Toys', emoji: '🧸' },
  { value: 'other', label: 'Other', emoji: '📦' },
];

const CONDITIONS = [
  { value: 'new', label: 'New', desc: 'Brand new, unused' },
  { value: 'like_new', label: 'Like New', desc: 'Barely used' },
  { value: 'good', label: 'Good', desc: 'Minor wear' },
  { value: 'fair', label: 'Fair', desc: 'Visible wear' },
  { value: 'poor', label: 'Poor', desc: 'Heavy wear' },
];

export default function CreateProduct() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'other',
    condition: 'good',
    location: '',
  });

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    const total = images.length + files.length;
    if (total > 6) {
      alert('Maximum 6 images');
      return;
    }
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages([...images, ...newImages]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(images[index].preview);
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price || images.length === 0) {
      alert('Please fill in title, price, and add at least one image');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('price', form.price);
    formData.append('category', form.category);
    formData.append('condition', form.condition);
    if (form.description) formData.append('description', form.description);
    if (form.location) formData.append('location', form.location);
    images.forEach((img) => formData.append('images', img.file));

    const result = await dispatch(createProduct(formData));
    setSubmitting(false);
    if (!result.error) navigate('/marketplace');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Sell an Item</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Images */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-gray-400" />
              Photos
            </span>
            <span className="text-xs font-normal text-gray-400">{images.length}/6</span>
          </label>
          <div className="grid grid-cols-3 gap-3 mt-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                    Cover
                  </span>
                )}
              </div>
            ))}
            {images.length < 6 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                <ImagePlus className="w-7 h-7 text-gray-300 dark:text-gray-600 mb-1" />
                <span className="text-xs text-gray-400">Add</span>
                <input type="file" accept="image/*" multiple onChange={handleImageAdd} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Title & Price */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What are you selling?"
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
              Price (VND) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0"
              min="0"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Category */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm({ ...form, category: c.value })}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all ${
                  form.category === c.value
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Condition</label>
          <div className="space-y-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm({ ...form, condition: c.value })}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                  form.condition === c.value
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="font-medium">{c.label}</span>
                <span className={`text-xs ${form.condition === c.value ? 'text-gray-300 dark:text-gray-500' : 'text-gray-400'}`}>
                  {c.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Location & Description */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Ho Chi Minh City"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your item in detail..."
              rows={4}
              maxLength={5000}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent resize-none text-sm"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 text-white py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 hover:shadow-lg text-sm"
        >
          {submitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-white dark:border-t-gray-900" />
          ) : (
            <>
              <Upload className="w-4 h-4" />
              List for Sale
            </>
          )}
        </button>
      </form>
    </div>
  );
}
