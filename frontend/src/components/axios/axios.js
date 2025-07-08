import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://earnest-nature-production.up.railway.app/",
});

export default axiosInstance;