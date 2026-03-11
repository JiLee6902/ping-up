import { useNavigate } from 'react-router-dom';
import { X, LogIn } from 'lucide-react';

export default function LoginPrompt({ message, onClose }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <LogIn className="w-7 h-7 text-gray-400" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          Login Required
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {message || 'You need to log in to use this feature.'}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Log In
          </button>
        </div>

        <button
          onClick={() => navigate('/register')}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Don't have an account? <span className="font-medium underline">Sign up</span>
        </button>
      </div>
    </div>
  );
}
