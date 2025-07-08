import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "earnest-nature-production.up.railway.app:3001/",
});

export default axiosInstance;