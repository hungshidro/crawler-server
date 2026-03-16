import express from 'express';
import { crawlChapter, crawlNovel, crawlChapterList, userLogin } from '../controllers/crawlerController.js';

const router = express.Router();

// Login endpoint
router.post('/login', userLogin);

// Crawl một chapter cụ thể
router.post('/chapter', crawlChapter);

// Crawl thông tin truyện và danh sách chapters
router.post('/novel', crawlNovel);

// Crawl danh sách chapters
router.post('/chapters', crawlChapterList);

export default router;
