import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crawlerRoutes from './routes/crawler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Crawler Server API',
    version: '1.0.0',
    endpoints: {
      crawlChapter: 'POST /api/crawler/chapter',
      crawlNovel: 'POST /api/crawler/novel',
      getChapterList: 'POST /api/crawler/chapters'
    }
  });
});

app.use('/api/crawler', crawlerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
