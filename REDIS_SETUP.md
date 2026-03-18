# Redis Setup Guide

> **TL;DR - Quick Start:**
> 1. Đăng ký Upstash: https://console.upstash.com (free, không cần thẻ)
> 2. Tạo Redis database, copy Redis URL
> 3. Render: Environment → Add `REDIS_URL` → Save
> 4. Done! ✅

---

## 🚀 Option 1: Upstash Redis (RECOMMENDED - Easiest)

**Free tier:** 10,000 commands/day, 256MB RAM, perfect cho project này!

### Bước 1: Tạo Upstash Account

1. Truy cập: https://console.upstash.com/
2. Sign up (có thể dùng GitHub)
3. Miễn phí, không cần thẻ tín dụng

### Bước 2: Tạo Redis Database

1. Click **Create Database**
2. Chọn:
   - **Name**: vozer-crawler-cache
   - **Type**: Regional
   - **Region**: Chọn gần bạn nhất (Singapore/Tokyo cho VN)
   - **Price**: Free
3. Click **Create**

### Bước 3: Lấy Connection URL

1. Vào database vừa tạo
2. Scroll xuống **REST API** section
3. Copy **UPSTASH_REDIS_REST_URL** (format: `https://xxx.upstash.io`)
   
   **HOẶC** dùng Redis URL truyền thống:
4. Tab **Connection** → Copy **redis://...** URL

### Bước 4: Set Environment Variable trên Render

1. Vào Render Dashboard → Web Service
2. **Environment** → **Environment Variables**
3. Add:
   ```
   REDIS_URL = <paste Upstash Redis URL>
   ```
4. **Save Changes** → Auto redeploy

**Done!** 🎉

---

## 🚀 Option 2: Render Redis (Hơi phức tạp hơn)

Trên Render, Redis là **separate service**, không phải addon.

### Bước 1: Tạo Redis Instance

1. Vào Render Dashboard: https://dashboard.render.com
2. Click **New +** → **Redis**
3. Chọn:
   - **Name**: vozer-redis
   - **Region**: Chọn cùng region với Web Service
   - **Plan**: Free (25MB)
   - **Maxmemory Policy**: allkeys-lru (recommended cho cache)
4. Click **Create Redis**

### Bước 2: Lấy Connection Info

Sau khi Redis instance được tạo:
1. Vào Redis instance
2. Copy **Internal Redis URL** (format: `redis://red-xxxxx:6379`)
   - Internal URL: Free, chỉ dùng trong Render network
   - External URL: $0.10/GB bandwidth

### Bước 3: Connect với Web Service

1. Quay lại **Web Service**
2. **Environment** → **Environment Variables**
3. Add:
   ```
   REDIS_URL = <paste Internal Redis URL>
   ```
4. **Save Changes** → Render sẽ redeploy

**Note:** Web Service và Redis phải cùng region thì mới dùng Internal URL được.

---

## 🆚 So sánh các options

| | Upstash | Render Redis | No Redis |
|---|---------|--------------|----------|
| Setup | ⭐⭐⭐ Dễ nhất | ⭐⭐ Hơi khó | ⭐⭐⭐ Không cần |
| Free tier | 10K cmds/day | 25MB RAM | N/A |
| Performance | Tốt | Tốt hơn (cùng network) | Chậm |
| Persistence | ✅ Có | ❌ Không | N/A |
| Use case | Production | Production | Dev only |

**Recommendation:** Dùng **Upstash** cho dễ, hoặc **Render Redis** nếu muốn performance tốt hơn.

---

## 💻 Local Development (Optional)

Server vẫn chạy bình thường, chỉ không có cache:
```bash
npm start
# Output: ⚠️  REDIS_URL not found - running without cache
```

### Option 2: Dùng Redis Local

#### Cài đặt Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

**Windows:**
- Download từ: https://github.com/microsoftarchive/redis/releases
- Hoặc dùng Docker: `docker run -d -p 6379:6379 redis`

#### Cấu hình

Tạo file `.env` (copy từ `.env.example`):
```env
REDIS_URL=redis://localhost:6379
```

#### Kiểm tra Redis

```bash
redis-cli ping
# Expected: PONG
```

---

## 📊 Features với Redis

### 1. **Session Cookie Cache**
- Cookies được lưu trong Redis với TTL 24h
- Restart server không mất cookies → **không cần login lại**
- Multi-instance share cookies

### 2. **Chapter Content Cache**
- Mỗi chapter được cache 1 giờ
- Response nhanh gấp **50-100x** khi cache hit
- Giảm 80% requests đến vozer.io

### 3. **Auto Cleanup**
- Redis tự động xóa expired keys
- Không cần manual cleanup

---

## 🔍 Monitoring & Debug

### Kiểm tra Redis

**Upstash:**
1. Vào Upstash Console: https://console.upstash.com
2. Click vào database
3. Tab **CLI** → có web-based Redis CLI ngay trong browser
4. Hoặc dùng `redis-cli`:
   ```bash
   redis-cli -u <REDIS_URL>
   ```

**Render Redis:**
1. Vào Redis instance trên Render
2. Tab **Shell** hoặc dùng External URL:
   ```bash
   redis-cli -u <EXTERNAL_REDIS_URL>
   ```

### Commands hữu ích

```bash
# Xem tất cả keys
KEYS *

# Xem cookies
GET vozer:session:cookies

# Xem một chapter cache
KEYS chapter:*
GET chapter:https://vozer.io/...

# Xem TTL còn lại
TTL vozer:session:cookies

# Xóa cache thủ công
DEL vozer:session:cookies

# Xóa tất cả
FLUSHALL
```

### Server logs

```javascript
✅ Redis connected          // Connect thành công
✅ Loaded cookies from Redis cache  // Load cookies từ cache
✅ Saved cookies to Redis cache    // Save cookies sau login
✅ Cache hit for: <url>           // Chapter từ cache
✅ Cached chapter: <url>          // Chapter mới được cache
🗑️  Cleared cookies cache         // Clear cookies khi 503
```

---

## ⚡ Performance Impact

| Metric | Không Redis | Với Redis |
|--------|-------------|-----------|
| First request | ~3-5s | ~3-5s |
| Cached request | ~3-5s | **<100ms** |
| Restart server | Phải login (10-15s) | **Không cần login** |
| 100 requests cùng chapter | 100 crawls | 1 crawl + 99 cache hits |

---

## 🐛 Troubleshooting

### "Redis connection failed"
- **Render:** Kiểm tra REDIS_URL đã set đúng chưa
- **Local:** Kiểm tra Redis có đang chạy: `redis-cli ping`

### "Redis error: READONLY"
- Redis đang ở read-only mode (failover)
- Server sẽ tự động retry
- Không ảnh hưởng, chỉ không cache được

### Cache không work
```bash
# Check Redis có data không
redis-cli -u $REDIS_URL
> KEYS *
> TTL vozer:session:cookies
```

### Clear cache để test
```bash
# Clear all cache
redis-cli -u $REDIS_URL FLUSHALL

# Hoặc xóa specific key
redis-cli -u $REDIS_URL DEL vozer:session:cookies
```

---

## 🎯 Next Steps

Sau khi setup Redis, bạn có thể:

1. ✅ Restart server mà không mất cookies
2. ✅ Scale lên nhiều instances (Render Pro)
3. ✅ Add rate limiting với Redis
4. ✅ Add background job queue (Bull/BullMQ)

**Production checklist:**
- [ ] Redis instance created trên Render
- [ ] REDIS_URL environment variable set
- [ ] Deploy successful
- [ ] Check logs có "Redis connected"
- [ ] Test một chapter request
- [ ] Test lại chapter đó (should cache hit)
