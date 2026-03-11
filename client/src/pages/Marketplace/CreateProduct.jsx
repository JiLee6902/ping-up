import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft, Upload, X, ImagePlus } from 'lucide-react';
import { createProduct } from '../../features/marketplace/marketplaceSlice';

const CATEGORIES = [
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
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
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

    if (!result.error) {
      navigate('/marketplace');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Sell an Item</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Photos ({images.length}/6)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors">
                <ImagePlus className="w-8 h-8 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageAdd}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="What are you selling?"
            maxLength={200}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Price (VND) *
          </label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="0"
            min="0"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category & Condition */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Condition
            </label>
            <select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Ho Chi Minh City"
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe your item..."
            rows={4}
            maxLength={5000}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
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
