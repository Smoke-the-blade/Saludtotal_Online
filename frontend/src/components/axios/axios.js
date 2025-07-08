import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://172.20.10.13:3001/",
});

export default axiosInstance;