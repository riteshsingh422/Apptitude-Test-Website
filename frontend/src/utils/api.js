// frontend/src/utils/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'https://insabhi-test.onrender.com/api',
  timeout: 10000,
});

export default API;