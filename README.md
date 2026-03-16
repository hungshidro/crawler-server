# Crawler Server - Web Novel

Server crawl truyện chữ từ các website như vozer.io, hỗ trợ mở rộng cho nhiều nguồn khác

## Cài đặt

```bash
npm install
```

## Cấu hình

Copy cookies từ browser vào file `.env`:

```env
VOZER_EMAIL=your_email@gmail.com
VOZER_PASSWORD=your_password
VOZER_COOKIES=laravel_session=...; XSRF-TOKEN=...
```

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

### 4. Login (optional)

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
