const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:5000`;

export default API_BASE_URL;
