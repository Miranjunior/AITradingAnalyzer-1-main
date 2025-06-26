import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import { registerRoutes } from '../server/routes.js';
import { storage } from '../server/storage.js';
import { mockDataService } from '../server/services/mockDataService.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize mock data for demo mode
const initializeData = async () => {
  try {
    console.log('Initializing market data for serverless deployment...');
    await mockDataService.initializeMockData();
    console.log('Market data initialization completed');
  } catch (error) {
    console.error('Error during initialization:', error);
  }
};

// Initialize data on cold start
initializeData();

// Register API routes
registerRoutes(app);

// Handle errors
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export const handler = serverlessExpress({ app });