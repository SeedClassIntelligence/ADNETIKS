/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Production Server
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleGenerateContent, handleGenerateImage, handleDiscoverAvatars } from './src/server/api.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API Endpoints
app.post('/api/discover-avatars', async (req, res) => {
  try {
    const result = await handleDiscoverAvatars(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Avatar Discovery error' });
  }
});

app.post('/api/generate-content', async (req, res) => {
  try {
    const result = await handleGenerateContent(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'AI Generation error' });
  }
});

app.post('/api/generate-image', async (req, res) => {
  try {
    const result = await handleGenerateImage(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Image Generation error' });
  }
});

// Serve static frontend in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`ADNETIKS server running on port ${port}`);
});
