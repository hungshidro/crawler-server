# Batch Crawl API - Examples & Usage

## 📚 Use Cases

### 1. Crawl 10 chapters đầu tiên
```bash
curl -X POST http://localhost:3000/api/crawler/chapters/batch \
  -H "Content-Type: application/json" \
  -d '{
    "startUrl": "https://vozer.io/quy-bi-chi-chu/chuong-1",
    "endChapter": 10
  }'
```

### 2. Crawl toàn bộ truyện (tối đa 100 chapters)
```bash
curl -X POST http://localhost:3000/api/crawler/chapters/batch \
  -H "Content-Type: application/json" \
  -d '{
    "startUrl": "https://vozer.io/quy-bi-chi-chu/chuong-1"
  }'
```

### 3. Crawl với giới hạn custom
```bash
curl -X POST http://localhost:3000/api/crawler/chapters/batch \
  -H "Content-Type: application/json" \
  -d '{
    "startUrl": "https://vozer.io/quy-bi-chi-chu/chuong-1",
    "maxChapters": 50
  }'
```

### 4. Crawl từ chapter giữa đến chapter cuối
```bash
curl -X POST http://localhost:3000/api/crawler/chapters/batch \
  -H "Content-Type: application/json" \
  -d '{
    "startUrl": "https://vozer.io/quy-bi-chi-chu/chuong-500",
    "endChapter": 550
  }'
```

---

## 🔴 Real-time Progress với Server-Sent Events (SSE)

### JavaScript/Fetch API Example

```javascript
async function batchCrawlWithProgress(startUrl, endChapter) {
  const response = await fetch('http://localhost:3000/api/crawler/chapters/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify({ startUrl, endChapter })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        
        if (data.type === 'complete') {
          console.log('✅ Complete!', data.result);
        } else {
          console.log(`📖 Progress: Chapter ${data.chapterNumber} - ${data.title}`);
        }
      }
    }
  }
}

// Usage
batchCrawlWithProgress('https://vozer.io/truyen/chuong-1', 10);
```

### Node.js EventSource Example

```javascript
const EventSource = require('eventsource');

const url = 'http://localhost:3000/api/crawler/chapters/batch';
const body = JSON.stringify({
  startUrl: 'https://vozer.io/quy-bi-chi-chu/chuong-1',
  endChapter: 10
});

const es = new EventSource(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  },
  body: body
});

es.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'complete') {
    console.log('✅ Batch crawl complete!');
    console.log(`Total chapters: ${data.result.total}`);
    es.close();
  } else {
    console.log(`📖 Crawling chapter ${data.chapterNumber}: ${data.title}`);
  }
};

es.onerror = (error) => {
  console.error('❌ Error:', error);
  es.close();
};
```

### cURL with SSE

```bash
curl -N -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"startUrl":"https://vozer.io/quy-bi-chi-chu/chuong-1","endChapter":10}' \
  http://localhost:3000/api/crawler/chapters/batch
```

Output:
```
data: {"current":1,"chapterNumber":"1","title":"Chương 1: Đỏ tươi","url":"..."}

data: {"current":2,"chapterNumber":"2","title":"Chương 2: Ngủ mê","url":"..."}

data: {"type":"complete","result":{...}}
```

---

## 📊 Response Format

### Success Response

```json
{
  "success": true,
  "totalSuccess": 10,
  "totalFailed": 0,
  "message": "Crawled 10 chapters successfully"
}
```

**Note:** Response **chỉ chứa số lượng** (numbers), **không có danh sách chapters**. Content của tất cả chapters đã được crawl và cache trong Redis.

**Để lấy full content của chapters:**
1. Nếu có Redis, content đã được cache → gọi API `/api/crawler/chapter` với URL của chapter sẽ trả về ngay lập tức từ cache
2. Nếu không có Redis, gọi API `/api/crawler/chapter` sẽ crawl lại chapter đó

### Response với Errors

```json
{
  "success": true,
  "totalSuccess": 8,
  "totalFailed": 2,
  "message": "Crawled 8 chapters successfully, 2 chapters failed"
}
```

### Response khi đạt limit

```json
{
  "success": true,
  "totalSuccess": 100,
  "totalFailed": 0,
  "limitReached": true,
  "message": "Crawled 100 chapters successfully (reached max limit: 100)"
}
```

---

## ⚙️ Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startUrl` | string | ✅ Yes | - | URL của chapter bắt đầu |
| `endChapter` | number | ❌ No | `null` | Số chương kết thúc. Nếu không có, crawl đến hết |
| `maxChapters` | number | ❌ No | `100` | Giới hạn số chapters tối đa để tránh timeout |
| `type` | string | ❌ No | `"vozer"` | Loại website nguồn |

---

## 🎯 Features

### ✅ Auto Navigation
- Tự động phát hiện link chapter tiếp theo từ `navigation.next`
- Không cần biết URL pattern

### ✅ Smart Stop Conditions
- Dừng khi không còn `next` chapter (hết rồi)
- Dừng khi đạt `endChapter`
- Dừng khi đạt `maxChapters` limit
- Dừng khi có quá nhiều lỗi liên tiếp (3 lỗi)

### ✅ Auto Recovery
- Tự động login lại khi cookies hết hạn (503 error)
- Skip failed chapters và continue
- Retry mechanism built-in

### ✅ Performance & Safety
- Random delay 1-2s giữa các requests
- Respect website rate limits
- Cache chapters trong Redis (nếu có)
- Continue on error (không crash khi 1 chapter lỗi)

### ✅ Progress Tracking
- Real-time progress qua Server-Sent Events
- Console logs chi tiết
- Error tracking

---

## 📝 Best Practices

### 1. Test với số lượng nhỏ trước
```json
{
  "startUrl": "https://vozer.io/truyen/chuong-1",
  "endChapter": 5
}
```

### 2. Sử dụng maxChapters cho production
```json
{
  "startUrl": "https://vozer.io/truyen/chuong-1",
  "maxChapters": 50
}
```
**Lý do:** Tránh timeout. Nếu cần > 50 chapters, chia thành nhiều requests:
- Request 1: Chapter 1-50
- Request 2: Chapter 51-100
- ...

### 3. Monitor progress với SSE
Sử dụng SSE để biết được tiến độ real-time thay vì đợi response cuối cùng.

### 4. Handle errors gracefully
```javascript
try {
  const result = await batchCrawl(startUrl, endChapter);
  
  if (result.errors && result.errors.length > 0) {
    console.log('⚠️ Some chapters failed:', result.errors);
    // Retry failed chapters
    for (const error of result.errors) {
      await retrySingleChapter(error.url);
    }
  }
} catch (error) {
  console.error('Batch crawl failed:', error);
}
```

---

## ⏱️ Performance Tips

### Response Size
- **Batch API response**: <1KB (chỉ numbers)
- **Single chapter API**: ~50-200KB (có full content)
- **100 chapters batch**: <1KB response
- **100 chapters full content**: ~5-20MB total (get từng chapter sau)

### Với Redis Cache
- Batch crawl 10 chapters lần đầu: ~40s (crawl + cache)
- Lấy full content 10 chapters từ cache: ~1s (10 x 100ms)
- **Total workflow:** ~41s
- **Re-run (all cached):** ~1s

### Không có Redis
- Batch crawl 10 chapters: ~40s
- Lấy lại 10 chapters: ~40s (phải crawl lại)
- **Total workflow:** ~80s

### Recommendations
- ✅ **Setup Redis** để tăng tốc dramatically
- ✅ Batch crawl trước, lấy content sau (từ cache)
- ✅ Sử dụng `endChapter` để control batch size
- ✅ Chạy batch crawl vào off-peak hours nếu crawl nhiều
- ✅ Monitor server resources (CPU, Memory)

---

## 🐛 Troubleshooting

### "Too many errors, stopping batch crawl"
**Nguyên nhân:** 3 chapters liên tiếp lỗi

**Fix:**
- Check cookies còn valid không
- Check URL pattern có đúng không
- Crawl manual từng chapter để debug

### Request timeout
**Nguyên nhân:** Batch quá lớn

**Fix:**
- Giảm `maxChapters` xuống 20-50
- Hoặc tăng timeout của HTTP client/load balancer

### Chapters bị duplicate
**Nguyên nhân:** Crawl cùng range nhiều lần

**Check:** Redis cache có các chapters rồi
```bash
redis-cli KEYS "chapter:*"
```

**Clear cache nếu cần:**
```bash
redis-cli FLUSHALL
```

### Memory issues với batch lớn
**Nguyên nhân:** Response chứa quá nhiều data

**Fix:**
- Giảm `maxChapters`
- Hoặc không return full content trong response (chỉ return success/fail)
- Stream data ra file thay vì return qua HTTP

---

## 🔗 Related APIs

- `POST /api/crawler/chapter` - Crawl 1 chapter
- `POST /api/crawler/chapters` - List all chapters (không crawl content)
- `POST /api/crawler/novel` - Crawl novel info

---

## 💡 Example: Crawl toàn bộ truyện từng phần

**Note:** Vì batch API chỉ trả về numbers, cần track chapter numbers manually hoặc sử dụng `/api/crawler/chapters` để lấy list trước.

```javascript
async function crawlFullNovel(novelUrl, batchSize = 50) {
  // Step 1: Get chapter list first
  console.log('Getting chapter list...');
  const chapterList = await fetch('http://localhost:3000/api/crawler/chapters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: novelUrl })
  }).then(r => r.json());

  const chapters = chapterList.data.chapters;
  console.log(`Found ${chapters.length} chapters`);

  // Step 2: Batch crawl in chunks
  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < chapters.length; i += batchSize) {
    const chunk = chapters.slice(i, Math.min(i + batchSize, chapters.length));
    const startUrl = chunk[0].url;
    const endChapter = chunk[chunk.length - 1].number;

    console.log(`Crawling batch ${Math.floor(i / batchSize) + 1}: Chapters ${chunk[0].number}-${endChapter}...`);

    const result = await fetch('http://localhost:3000/api/crawler/chapters/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startUrl, endChapter })
    }).then(r => r.json());

    totalSuccess += result.totalSuccess;
    totalFailed += result.totalFailed;
    
    console.log(`✅ Batch complete: ${result.totalSuccess} success, ${result.totalFailed} failed`);

    // Wait before next batch
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log(`\n🏁 Finished! Total: ${totalSuccess} success, ${totalFailed} failed`);
  return { totalSuccess, totalFailed, totalChapters: chapters.length };
}

// Usage
crawlFullNovel('https://vozer.io/quy-bi-chi-chu', 50);
```

---

## 💡 Example: Lấy full content sau batch crawl

```javascript
async function crawlAndGetFullContent(novelUrl, startChapter, endChapter) {
  // Step 1: Get chapter list to know URLs
  console.log('Getting chapter list...');
  const chapterList = await fetch('http://localhost:3000/api/crawler/chapters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: novelUrl })
  }).then(r => r.json());

  // Filter chapters in range
  const chapters = chapterList.data.chapters.filter(ch => {
    const num = parseInt(ch.number);
    return num >= startChapter && num <= endChapter;
  });

  console.log(`Found ${chapters.length} chapters in range ${startChapter}-${endChapter}`);

  // Step 2: Batch crawl (cache content)
  console.log('\nStep 2: Batch crawling chapters...');
  const batchResult = await fetch('http://localhost:3000/api/crawler/chapters/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      startUrl: chapters[0].url, 
      endChapter 
    })
  }).then(r => r.json());

  console.log(`✅ Crawled ${batchResult.totalSuccess} chapters (${batchResult.totalFailed} failed)`);

  // Step 3: Get full content from cache (very fast)
  console.log('\nStep 3: Fetching full content from cache...');
  const chaptersWithContent = [];

  for (const chapter of chapters) {
    const fullData = await fetch('http://localhost:3000/api/crawler/chapter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: chapter.url })
    }).then(r => r.json());

    chaptersWithContent.push(fullData.data);
    console.log(`📦 Got content for chapter ${chapter.number}`);
  }

  console.log(`\n✅ Complete! Got ${chaptersWithContent.length} chapters with full content`);
  return chaptersWithContent;
}

// Usage
const chapters = await crawlAndGetFullContent(
  'https://vozer.io/quy-bi-chi-chu',
  1,
  10
);
```

---

**Happy crawling! 🚀**
