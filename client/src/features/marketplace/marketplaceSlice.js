import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';
import { toast } from 'react-hot-toast';

export const fetchProducts = createAsyncThunk(
  'marketplace/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, value);
        }
      });
      const { data } = await axios.get(`/api/marketplace/search?${query}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
    }
  },
);

export const fetchProductDetail = createAsyncThunk(
  'marketplace/fetchProductDetail',
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`/api/marketplace/${productId}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Product not found');
    }
  },
);

export const fetchMyListings = createAsyncThunk(
  'marketplace/fetchMyListings',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('/api/marketplace/my-listings');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch listings');
    }
  },
);

export const fetchSavedProducts = createAsyncThunk(
  'marketplace/fetchSavedProducts',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('/api/marketplace/saved');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch saved products');
    }
  },
);

export const createProduct = createAsyncThunk(
  'marketplace/createProduct',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('/api/marketplace', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Product listed successfully!');
      return data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product');
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const updateProduct = createAsyncThunk(
  'marketplace/updateProduct',
  async ({ productId, formData }, { rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/marketplace/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Product updated!');
      return data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update product');
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const deleteProduct = createAsyncThunk(
  'marketplace/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/marketplace/${productId}`);
      toast.success('Product deleted');
      return productId;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const toggleSaveProduct = createAsyncThunk(
  'marketplace/toggleSave',
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('/api/marketplace/save', { productId });
      return { productId, isSaved: data.isSaved };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const markAsSold = createAsyncThunk(
  'marketplace/markAsSold',
  async (productId, { rejectWithValue }) => {
    try {
      await axios.post(`/api/marketplace/${productId}/sold`);
      toast.success('Product marked as sold');
      return productId;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const fetchCategories = createAsyncThunk(
  'marketplace/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get('/api/marketplace/categories');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const fetchSellerProfile = createAsyncThunk(
  'marketplace/fetchSellerProfile',
  async (sellerId, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`/api/marketplace/seller/${sellerId}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const createReview = createAsyncThunk(
  'marketplace/createReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('/api/marketplace/review', reviewData);
      toast.success('Review submitted!');
      return data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState: {
    products: [],
    total: 0,
    hasMore: true,
    currentProduct: null,
    myListings: [],
    savedProducts: [],
    categories: [],
    sellerProfile: null,
    filters: {
      query: '',
      category: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      sortBy: 'newest',
    },
    loading: false,
    detailLoading: false,
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        query: '',
        category: '',
        condition: '',
        minPrice: '',
        maxPrice: '',
        location: '',
        sortBy: 'newest',
      };
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.total = action.payload.total;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchProducts.rejected, (state) => {
        state.loading = false;
      })
      // Product detail
      .addCase(fetchProductDetail.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchProductDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentProduct = action.payload.product;
      })
      .addCase(fetchProductDetail.rejected, (state) => {
        state.detailLoading = false;
      })
      // My listings
      .addCase(fetchMyListings.fulfilled, (state, action) => {
        state.myListings = action.payload.products;
      })
      // Saved
      .addCase(fetchSavedProducts.fulfilled, (state, action) => {
        state.savedProducts = action.payload.products;
      })
      // Toggle save
      .addCase(toggleSaveProduct.fulfilled, (state, action) => {
        const { productId, isSaved } = action.payload;
        // Update in products list
        const product = state.products.find((p) => p.id === productId);
        if (product) product.isSaved = isSaved;
        // Update current product
        if (state.currentProduct?.id === productId) {
          state.currentProduct.isSaved = isSaved;
        }
      })
      // Delete
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.myListings = state.myListings.filter((p) => p.id !== action.payload);
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      // Mark as sold
      .addCase(markAsSold.fulfilled, (state, action) => {
        const listing = state.myListings.find((p) => p.id === action.payload);
        if (listing) listing.status = 'sold';
      })
      // Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload.categories;
      })
      // Seller profile
      .addCase(fetchSellerProfile.fulfilled, (state, action) => {
        state.sellerProfile = action.payload;
      })
      // Create product
      .addCase(createProduct.fulfilled, (state, action) => {
        state.myListings.unshift(action.payload.product);
      });
  },
});

export const { setFilters, resetFilters, clearCurrentProduct } = marketplaceSlice.actions;
export default marketplaceSlice.reducer;
