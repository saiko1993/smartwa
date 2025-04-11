import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  classifyTransactionHandler,
  analyzeTransactionPatternsHandler,
  predictLimitExhaustionHandler,
  generateSmartRecommendationsHandler,
  getAIAssistantResponseHandler
} from "./ai-services";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for wallets
  app.get('/api/wallets', async (req, res) => {
    try {
      // This is just a stub - in a real app this would connect to a database
      // Since we're using client-side storage, this is here for API completeness
      res.json({ message: "This application uses client-side storage with IndexedDB" });
    } catch (error) {
      console.error('Error fetching wallets:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/wallets', async (req, res) => {
    try {
      // This is just a stub - in a real app this would connect to a database
      res.json({ message: "This application uses client-side storage with IndexedDB" });
    } catch (error) {
      console.error('Error creating wallet:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/wallets/:id', async (req, res) => {
    try {
      // This is just a stub - in a real app this would connect to a database
      res.json({ message: "This application uses client-side storage with IndexedDB" });
    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/wallets/:id', async (req, res) => {
    try {
      // This is just a stub - in a real app this would connect to a database
      res.json({ message: "This application uses client-side storage with IndexedDB" });
    } catch (error) {
      console.error('Error updating wallet:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/wallets/:id', async (req, res) => {
    try {
      // This is just a stub - in a real app this would connect to a database
      res.json({ message: "This application uses client-side storage with IndexedDB" });
    } catch (error) {
      console.error('Error deleting wallet:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // API routes for smart planning
  app.post('/api/generate-smart-plan', async (req, res) => {
    try {
      // This would normally connect to an AI service or use algorithms
      // Since we're doing client-side analysis, this is a stub
      res.json({ message: "Smart planning is handled client-side" });
    } catch (error) {
      console.error('Error generating smart plan:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/analyze-financial-errors', async (req, res) => {
    try {
      // This would normally connect to an AI service or use algorithms
      res.json({ message: "Financial analysis is handled client-side" });
    } catch (error) {
      console.error('Error analyzing finances:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // AI services endpoints
  app.post("/api/ai/classify-transaction", classifyTransactionHandler);
  app.post("/api/ai/analyze-patterns", analyzeTransactionPatternsHandler);
  app.post("/api/ai/predict-limit", predictLimitExhaustionHandler);
  app.post("/api/ai/smart-recommendations", generateSmartRecommendationsHandler);
  app.post("/api/ai/assistant", getAIAssistantResponseHandler);

  // PWA related endpoint to check server status
  app.get('/api/status', (req, res) => {
    res.json({ status: 'online' });
  });

  const httpServer = createServer(app);

  return httpServer;
}
