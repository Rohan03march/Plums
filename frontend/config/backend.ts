/**
 * Centralized Backend Configuration
 * 
 * To switch to localhost:
 * 1. Update the .env file with your local IP (e.g., 192.168.1.41)
 * 2. Or change the fallback here if needed
 */

const LOCAL_IP = "192.168.1.41"; // Your common local IP
const PORT = "3000";

export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || `http://${LOCAL_IP}:${PORT}`;

console.log("[Backend] API URL:", BACKEND_URL);
