// Cấu hình độc lập tại MiniApp/.env; phải build lại sau khi thay đổi.
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:4012").replace(/\/$/, "");
export default API_BASE_URL;
