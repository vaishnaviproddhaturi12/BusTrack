const LOCAL_API_URL = "http://localhost:5000";
const PRODUCTION_API_URL =
  process.env.REACT_APP_API_BASE_URL || "https://bustrack-backend-dod9.onrender.com";

const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const API_BASE_URL = isLocalHost ? LOCAL_API_URL : PRODUCTION_API_URL;

export default API_BASE_URL;
