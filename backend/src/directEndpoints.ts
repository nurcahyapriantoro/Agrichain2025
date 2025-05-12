import express from 'express';
import cors from 'cors';
import axios from 'axios';

// Create a standalone express app for direct endpoints
const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Define the main API URL
const MAIN_API_URL = 'http://localhost:5010/api';

// User statistics endpoint - forward to real API
app.get('/api/user/statistics', async (req, res) => {
  console.log('Forwarding statistics request to main API');
  
  try {
    const response = await axios.get(`${MAIN_API_URL}/user/statistics`);
    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding statistics request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user statistics from main API'
    });
  }
});

// User trend endpoint - forward to real API
app.get('/api/user/trend', async (req, res) => {
  console.log('Forwarding trend request to main API');
  
  try {
    const period = req.query.period || 'monthly';
    const response = await axios.get(`${MAIN_API_URL}/user/trend?period=${period}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding trend request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user signup trend from main API'
    });
  }
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Direct endpoints service is running',
    timestamp: Date.now()
  });
});

// Start the server on a different port
const PORT = 5020;
app.listen(PORT, () => {
  console.log(`Direct endpoints server running on port ${PORT}`);
});

export default app; 