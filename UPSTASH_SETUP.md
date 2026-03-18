# Hướng dẫn Setup Upstash Redis (Chi tiết từng bước)

## 🎯 Tại sao dùng Upstash?

- ✅ **Free tier tốt nhất**: 10,000 commands/day, 256MB RAM
- ✅ **Dễ setup**: 5 phút là xong
- ✅ **Không cần thẻ tín dụng**
- ✅ **Có persistence**: Không mất data khi restart
- ✅ **Global**: Deploy ở nhiều regions
- ✅ **Web UI**: Xem data ngay trong browser

---

## 📝 Step-by-Step Guide

### Step 1: Tạo Upstash Account

1. Mở browser, truy cập: **https://console.upstash.com**

2. Click nút **Sign Up** hoặc **Get Started**

3. Chọn một trong các cách:
   - **Continue with GitHub** (recommended - nhanh nhất)
   - **Continue with Google**
   - Email + Password

4. Sau khi đăng nhập, bạn sẽ thấy Dashboard

---

### Step 2: Tạo Redis Database

1. Ở Dashboard, click nút **Create Database** (màu xanh, to)

2. Điền thông tin:

   **Name:** 
   ```
   vozer-crawler
   ```
   (tùy ý, đặt tên gì cũng được)

   **Type:** 
   - Chọn **Regional** (free tier)
   - Không chọn Global (trả phí)

   **Region:**
   - Chọn gần Việt Nam nhất:
     - ✅ **ap-southeast-1 (Singapore)** - gần nhất, ping thấp
     - ✅ **ap-northeast-1 (Tokyo)** - backup choice
   - Nếu Render Web Service bạn ở region khác thì chọn cùng region

   **Eviction:**
   - Chọn **allkeys-lru** (tự động xóa key cũ khi hết RAM)

   **TLS:**
   - ✅ Bật TLS (Enabled) - bảo mật

3. Click **Create** (màu xanh)

4. Đợi 10-30 giây, database sẽ được tạo

---

### Step 3: Lấy Redis URL

1. Click vào database vừa tạo (tên `vozer-crawler`)

2. Bạn sẽ thấy màn hình **Database Details**

3. Scroll xuống section **Connection**

4. Tìm dòng **UPSTASH_REDIS_REST_URL** hoặc **Redis URL**

5. Copy URL (có dạng):
   ```
   redis://:xxxxxxxxxxxxxxxxx@reformed-mantis-12345.upstash.io:6379
   ```
   hoặc
   ```
   rediss://:xxxxxxxxxxxxxxxxx@reformed-mantis-12345.upstash.io:6379
   ```

6. **Click icon Copy** bên cạnh để copy

   ⚠️ **Quan trọng:** URL này là **secret**, đừng share public!

---

### Step 4: Add vào Render Environment

1. Mở tab mới, truy cập: **https://dashboard.render.com**

2. Click vào **Web Service** của bạn (crawler-server)

3. Ở sidebar bên trái, click **Environment**

4. Ở section **Environment Variables**, click **Add Environment Variable**

5. Điền:
   - **Key:** 
     ```
     REDIS_URL
     ```
   - **Value:** 
     ```
     <paste Redis URL từ Upstash>
     ```
     Paste URL bạn vừa copy ở Step 3

6. Click **Save Changes** (màu xanh)

7. Render sẽ tự động **redeploy** service
   - Đợi 2-3 phút
   - Màn hình sẽ hiện logs deploy

---

### Step 5: Verify (Kiểm tra)

#### 5.1. Check Logs trên Render

1. Vẫn ở Web Service, click tab **Logs**

2. Scroll xuống logs mới nhất

3. Tìm dòng:
   ```
   ✅ Redis connected
   ```

4. Nếu thấy dòng này → **Success!** 🎉

5. Nếu thấy error:
   ```
   ❌ Redis error: ...
   ```
   → Quay lại Step 4, check REDIS_URL có đúng không

#### 5.2. Test API

1. Mở Postman/Thunder Client/hoặc curl

2. Gọi API crawl một chapter:
   ```bash
   curl -X POST https://your-app.onrender.com/api/crawler/chapter \
     -H "Content-Type: application/json" \
     -d '{"url": "https://vozer.io/truyen/some-chapter"}'
   ```

3. Gọi lại API đó lần thứ 2

4. Check logs, nếu thấy:
   ```
   ✅ Cache hit for: https://vozer.io/...
   ```
   → Cache đã work! 🚀

#### 5.3. Check Data trong Upstash

1. Quay lại Upstash Console: https://console.upstash.com

2. Click vào database `vozer-crawler`

3. Click tab **CLI** (ở top menu)

4. Gõ commands:
   ```redis
   KEYS *
   ```
   → Sẽ thấy list các keys như:
   ```
   vozer:session:cookies
   chapter:https://vozer.io/...
   ```

5. Xem cookies:
   ```redis
   GET vozer:session:cookies
   ```

6. Xem TTL:
   ```redis
   TTL vozer:session:cookies
   ```
   → Số giây còn lại (86400 = 24h)

---

## ✅ Checklist - Đã xong chưa?

- [ ] Tạo Upstash account
- [ ] Tạo Redis database (region Singapore/Tokyo)
- [ ] Copy Redis URL
- [ ] Set REDIS_URL trên Render
- [ ] Redeploy thành công
- [ ] Thấy "Redis connected" trong logs
- [ ] Test API, cache hoạt động
- [ ] Thấy data trong Upstash CLI

**Nếu tất cả ✅ → Hoàn thành!** 🎉

---

## 🐛 Troubleshooting

### "Redis connection failed" hoặc "ECONNREFUSED"

**Nguyên nhân:** REDIS_URL sai hoặc chưa set

**Fix:**
1. Check Render → Environment → REDIS_URL có tồn tại không
2. Copy lại Redis URL từ Upstash
3. Paste lại vào Render
4. Save Changes → Redeploy

---

### "Authentication failed" hoặc "NOAUTH"

**Nguyên nhân:** Redis URL thiếu password

**Fix:**
1. Upstash URL phải có format: `redis://:PASSWORD@host:port`
2. Check có dấu `:` trước password không
3. Copy lại từ Upstash (dùng nút Copy, đừng gõ tay)

---

### Thấy "running without cache" trong logs

**Nguyên nhân:** REDIS_URL không được set hoặc empty

**Fix:**
1. Go to Render → Environment
2. Check REDIS_URL value có empty không
3. Nếu empty, paste lại URL
4. Redeploy

---

### "Too many connections" hoặc rate limit

**Nguyên nhân:** Vượt quá 10,000 commands/day (Upstash free tier)

**Check usage:**
1. Upstash Console → Database
2. Tab **Metrics** → xem số commands đã dùng

**Fix:**
- Tăng cache TTL trong code (hiện tại: 1h cho chapter, 24h cho cookies)
- Upgrade Upstash plan (từ $10/month)
- Giảm số requests test

---

### Cache không update khi content thay đổi

**Nguyên nhân:** Chapter đã được cache (TTL 1h)

**Fix manual:**
1. Upstash Console → Database → CLI
2. Xóa cache của chapter đó:
   ```redis
   DEL chapter:https://vozer.io/truyen/chapter-url
   ```
3. Hoặc xóa tất cả cache:
   ```redis
   FLUSHALL
   ```

**Fix code:** Giảm TTL trong `vozerService.js`:
```javascript
// Line ~420
await cacheSet(cacheKey, JSON.stringify(result), 600); // 10 phút thay vì 3600
```

---

## 📊 Monitoring Usage

### Upstash Dashboard

1. Upstash Console → Database `vozer-crawler`

2. Tab **Metrics**:
   - **Daily Commands**: Số commands đã dùng
   - **Storage**: Dung lượng RAM đã dùng
   - **Throughput**: Ops/second

3. Tab **Logs**: Xem commands gần đây

### Giới hạn Free Tier

| Metric | Free Tier | Recommended Usage |
|--------|-----------|-------------------|
| Commands | 10,000/day | ~400/hour, keep below 8,000 |
| Storage | 256 MB | ~200MB để an toàn |
| Connections | 1000 concurrent | Enough cho web service |
| Bandwidth | 1 GB/month | OK cho text data |

**Estimate cho project:**
- 1 login: ~5 commands (set cookies)
- 1 chapter cache hit: 1 command (GET)
- 1 chapter cache miss: 2 commands (GET + SET)
- 100 chapter requests → 100-200 commands

→ 10,000 commands = ~100 chapters cached/day = **đủ dư!**

---

## 🎯 Next Steps

Sau khi setup xong:

1. **Test thoroughly:**
   - Crawl vài chapters
   - Crawl lại các chapters đó (should cache hit)
   - Restart Render service (cookies should persist)

2. **Monitor trong vài ngày:**
   - Check Upstash Metrics
   - Nếu gần limit → tối ưu cache TTL

3. **Optional enhancements:**
   - Add rate limiting (dùng Redis)
   - Add analytics (track số lượng requests)
   - Add admin API để clear cache

---

## 🔗 Useful Links

- **Upstash Console:** https://console.upstash.com
- **Upstash Docs:** https://docs.upstash.com/redis
- **Redis Commands:** https://redis.io/commands
- **Render Dashboard:** https://dashboard.render.com

---

**Cần help?** Check REDIS_SETUP.md để biết thêm debugging tips! 🚀
