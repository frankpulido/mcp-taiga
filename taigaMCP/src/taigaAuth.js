import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Taiga API configuration
const TAIGA_API_URL = process.env.TAIGA_API_URL || 'https://api.taiga.io/api/v1';

// Store the auth token
let authToken = null;
let tokenExpiration = null;

/**
 * Authenticate with Taiga API and get an auth token
 * @param {string} username - Taiga username or email
 * @param {string} password - Taiga password
 * @returns {Promise<string>} - Auth token
 */
export async function authenticate(username, password) {
  try {
    const response = await axios.post(`${TAIGA_API_URL}/auth`, {
      type: 'normal',
      username,
      password
    });

    authToken = response.data.auth_token;
    // Set token expiration to 24 hours from now
    tokenExpiration = Date.now() + 24 * 60 * 60 * 1000;

    return authToken;
  } catch (error) {
    console.error('Authentication failed:', error.message);
    throw new Error('Failed to authenticate with Taiga');
  }
}

/**
 * Get the current auth token, refreshing if necessary
 * @returns {Promise<string>} - Auth token
 */
export async function getAuthToken() {
  // If token doesn't exist or is expired, authenticate again
  if (!authToken || Date.now() > tokenExpiration) {
    const username = process.env.TAIGA_USERNAME;
    const password = process.env.TAIGA_PASSWORD;

    if (!username || !password) {
      throw new Error('Taiga credentials not found in environment variables');
    }

    await authenticate(username, password);
  }

  return authToken;
}

/**
 * Create an axios instance with auth headers
 * @returns {Promise<import('axios').AxiosInstance>} - Axios instance with auth headers
 */
export async function createAuthenticatedClient() {
  const token = await getAuthToken();

  return axios.create({
    baseURL: TAIGA_API_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}
