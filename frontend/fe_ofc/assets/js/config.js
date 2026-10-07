window.APP_CONFIG = Object.freeze({
  // Tự động nhận diện local hay sản phẩm trực tuyến:
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : 'https://group06-restaurant-api.onrender.com', // 
  SUPABASE_URL: 'https://lgoxdzymyqanncrrqmlc.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_7qi05QXRAt1noNrWqNRwIQ_4xz8Vrfi',
});