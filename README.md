# Crawler Server - Web Novel

Server crawl truyện chữ từ các website như vozer.io, hỗ trợ mở rộng cho nhiều nguồn khác

## Cài đặt

```bash
npm install
```

## Cấu hình

Copy `.env.example` thành `.env` và điền thông tin:

```env
# Port
PORT=3000

# Redis (Optional - Highly Recommended for Production)
# Setup guide: UPSTASH_SETUP.md
REDIS_URL=redis://localhost:6379

# Vozer credentials
VOZER_EMAIL=your_email@gmail.com
VOZER_PASSWORD=your_password

# Hoặc dùng cookies trực tiếp (ưu tiên hơn)
VOZER_COOKIES=laravel_session=...; XSRF-TOKEN=...
```

### 🚀 Production Setup (Render + Upstash Redis)

**Để có performance tốt nhất, setup Redis cache:**

1. **Quick:** Xem [UPSTASH_SETUP.md](UPSTASH_SETUP.md) - Setup Redis miễn phí trong 5 phút
2. **Detailed:** Xem [REDIS_SETUP.md](REDIS_SETUP.md) - Đầy đủ options và troubleshooting

**Lợi ích:**
- ✅ Restart server không mất cookies (không cần login lại)
- ✅ Cache chapters → response nhanh gấp 50-100x
- ✅ Giảm 80% load lên vozer.io

**Server vẫn chạy bình thường nếu không có Redis**, chỉ không có cache.

## Chạy server

```bash
# Development mode với auto-reload
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## API Endpoints

### 1. Crawl một chapter

```bash
POST /api/crawler/chapter
Content-Type: application/json

{
  "url": "https://vozer.io/quy-bi-chi-chu/chuong-1",
  "type": "vozer"
}
```

**Parameters:**
- `url` (required): URL của chapter cần crawl
- `type` (optional): Loại website, mặc định là "vozer"

**Response:**
```json
{
  "success": true,
  "type": "vozer",
  "data": {
    "novelTitle": "Quy Bí Chi Chủ",
    "chapterTitle": "Chương 1: Đỏ tươi",
    "chapterNumber": "1",
    "content": "<p>...</p>",
    "navigation": {
      "prev": null,
      "next": "https://vozer.io/quy-bi-chi-chu/chuong-2"
    },
    "url": "https://vozer.io/quy-bi-chi-chu/chuong-1"
  }
}
```

### 2. Crawl thông tin truyện

```bash
POST /api/crawler/novel
Content-Type: application/json

{
  "url": "https://vozer.io/quy-bi-chi-chu",
  "type": "vozer"
}
```

### 3. Crawl danh sách chapters

```bash
POST /api/crawler/chapters
Content-Type: application/json

{
  "url": "https://vozer.io/quy-bi-chi-chu",
  "type": "vozer"
}
```

### 4. Crawl nhiều chapters tự động (Batch)

**Tự động crawl nhiều chapters liên tục từ chapter bắt đầu đến chapter kết thúc hoặc đến hết.**

```bash
POST /api/crawler/chapters/batch
Content-Type: application/json

{
  "startUrl": "https://vozer.io/quy-bi-chi-chu/chuong-1",
  "endChapter": 10,
  "maxChapters": 100,
  "type": "vozer"
}
```

**Parameters:**
- `startUrl` (required): URL của chapter bắt đầu
- `endChapter` (optional): Số chương kết thúc. Nếu không có, crawl đến hết
- `maxChapters` (optional): Giới hạn số chapters tối đa (default: 100, để tránh timeout)
- `type` (optional): Loại website, mặc định là "vozer"

**Response:**
```json
{
  "success": true,
  "totalSuccess": 10,
  "totalFailed": 0,
  "message": "Crawled 10 chapters successfully"
}
```

**Response với chapters failed:**
```json
{
  "success": true,
  "totalSuccess": 8,
  "totalFailed": 2,
  "message": "Crawled 8 chapters successfully, 2 chapters failed"
}
```

**Features:**
- ✅ Tự động phát hiện và crawl chapter tiếp theo
- ✅ Dừng khi hết chapters hoặc đạt `endChapter`
- ✅ Auto login lại nếu cookies hết hạn (503 error)
- ✅ Delay 1-2s giữa các chapters để tránh bị ban
- ✅ Continue on error (skip failed chapters)
- ✅ Progress tracking (hỗ trợ Server-Sent Events)
- ✅ **Lightweight response**: Chỉ trả về số lượng (numbers), content được cache tự động trong Redis

**Lấy full content sau batch crawl:**
```bash
# Chapters đã được cache, gọi API này sẽ trả về ngay lập tức
POST /api/crawler/chapter
Content-Type: application/json

{
  "url": "https://vozer.io/quy-bi-chi-chu/chuong-1"
}
```

📖 **Xem thêm examples:** [BATCH_CRAWL_EXAMPLES.md](BATCH_CRAWL_EXAMPLES.md)

### 5. Login (optional)

```bash
POST /api/crawler/login
Content-Type: application/json

{
  "username": "your_email",
  "password": "your_password",
  "type": "vozer"
}
```

## Supported Sources

- ✅ **vozer** - vozer.io (default)
- 🔄 **truyenfull** - Coming soon
- 🔄 **wikidich** - Coming soon

## Mở rộng thêm website

Để thêm support cho website mới:

1. Tạo service mới: `src/services/[website]Service.js`
2. Export các function: `crawlChapterContent`, `crawlNovelInfo`, `crawlChapters`, `login`
3. Thêm vào factory trong `src/controllers/crawlerController.js`:

```javascript
case 'truyenfull':
  return {
    crawlChapter: truyenFullService.crawlChapterContent,
    crawlNovel: truyenFullService.crawlNovelInfo,
    crawlChapters: truyenFullService.crawlChapters,
    login: truyenFullService.login
  };
```

## Tính năng

- ✅ Crawl nội dung chapter
- ✅ Crawl thông tin truyện
- ✅ Crawl danh sách chapters
- ✅ Support navigation (prev/next chapter)
- ✅ CORS enabled
- ✅ Error handling

## Công nghệ

- Node.js
- Express.js
- Axios (HTTP client)
- Cheerio (HTML parser)
- CORS

## Lưu ý

⚠️ **Disclaimer**: Server này chỉ dùng cho mục đích học tập và nghiên cứu. Vui lòng tuân thủ các quy định về bản quyền và điều khoản sử dụng của các website.
# crawler-server
