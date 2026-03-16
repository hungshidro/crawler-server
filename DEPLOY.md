# Hướng dẫn Deploy Crawler Server

## 1. Deploy lên Railway (Khuyến nghị - Dễ nhất)

### Bước 1: Tạo tài khoản Railway
- Truy cập: https://railway.app
- Đăng nhập bằng GitHub

### Bước 2: Deploy
```bash
# Cài Railway CLI
npm install -g @railway/cli

# Login
railway login

# Khởi tạo project
railway init

# Deploy
railway up
```

### Bước 3: Cấu hình Environment Variables
- Vào Railway Dashboard → Variables
- Thêm các biến:
  - `PORT`: 3000
  - `NODE_ENV`: production
  - `VOZER_EMAIL`: email của bạn
  - `VOZER_PASSWORD`: password của bạn
  - `VOZER_COOKIES`: (nếu có)

### Bước 4: Lấy URL
- Railway sẽ tự động tạo public URL
- Ví dụ: `https://your-app.railway.app`

---

## 2. Deploy lên Render

### Bước 1: Tạo tài khoản Render
- Truy cập: https://render.com
- Đăng nhập bằng GitHub

### Bước 2: Tạo Web Service
1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Chọn repo `crawler-server`
4. Render tự động detect `render.yaml`

### Bước 3: Cấu hình
- Build Command: `yarn install`
- Start Command: `node src/server.js`
- Thêm Environment Variables giống Railway

### Bước 4: Deploy
- Click "Create Web Service"
- Render sẽ tự động build và deploy
- URL: `https://your-app.onrender.com`

---

## 3. Deploy bằng Docker

### Build image
```bash
docker build -t crawler-server .
```

### Run container
```bash
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e VOZER_EMAIL=your_email \
  -e VOZER_PASSWORD=your_password \
  --name crawler-server \
  crawler-server
```

### Sử dụng docker-compose
Tạo file `docker-compose.yml`:
```yaml
version: '3.8'
services:
  crawler-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - VOZER_EMAIL=${VOZER_EMAIL}
      - VOZER_PASSWORD=${VOZER_PASSWORD}
      - VOZER_COOKIES=${VOZER_COOKIES}
    restart: unless-stopped
```

Chạy:
```bash
docker-compose up -d
```

---

## 4. Deploy lên VPS (Ubuntu/Linux)

### Bước 1: Cài đặt môi trường
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Cài Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Cài PM2
sudo npm install -g pm2
```

### Bước 2: Upload code
```bash
# Clone từ GitHub
git clone your-repo-url
cd crawler-server

# Hoặc upload bằng SCP
scp -r . user@your-server:/path/to/crawler-server
```

### Bước 3: Cài đặt dependencies
```bash
npm install --production
```

### Bước 4: Tạo file .env
```bash
nano .env
# Copy nội dung từ .env.example và điền thông tin
```

### Bước 5: Chạy với PM2
```bash
# Start server
pm2 start src/server.js --name crawler-server

# Save PM2 config
pm2 save

# Auto start on boot
pm2 startup
```

### Bước 6: Cấu hình Nginx (optional)
```bash
sudo apt install nginx

# Tạo config
sudo nano /etc/nginx/sites-available/crawler-server
```

Nội dung file:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/crawler-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 5. Deploy lên Fly.io

```bash
# Cài Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Deploy
fly deploy
```

---

## Kiểm tra Server

Sau khi deploy, test các endpoint:

```bash
# Health check
curl https://your-app-url.com/

# Test crawl chapter
curl -X POST https://your-app-url.com/api/crawler/chapter \
  -H "Content-Type: application/json" \
  -d '{"url": "https://vozer.io/truyen/example-chuong-1"}'
```

---

## Lưu ý quan trọng

1. **Environment Variables**: Luôn set đúng các biến môi trường, đặc biệt là credentials
2. **Security**: Không commit file `.env` lên GitHub
3. **Monitoring**: Sử dụng PM2 hoặc Railway logs để theo dõi
4. **SSL**: Railway và Render tự động có SSL, VPS cần cài Let's Encrypt
5. **Rate Limiting**: Cân nhắc thêm rate limiting cho production

---

## Platform So sánh

| Platform | Free Tier | Dễ dùng | SSL | Auto Deploy |
|----------|-----------|---------|-----|-------------|
| Railway  | 500h/month| ⭐⭐⭐⭐⭐ | ✅  | ✅          |
| Render   | 750h/month| ⭐⭐⭐⭐⭐ | ✅  | ✅          |
| Fly.io   | 3 VMs     | ⭐⭐⭐⭐  | ✅  | ✅          |
| VPS      | Paid      | ⭐⭐⭐   | ❌  | ❌          |

**Khuyến nghị**: Railway hoặc Render cho người mới bắt đầu!
