import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_VPI_URL || "",
  withCredentials: true,
});

export default api;
