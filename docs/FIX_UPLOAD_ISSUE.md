# Fix Upload Issue - Troubleshooting Guide

## 🐛 Issue

Upload requests are going to `http://localhost:5173/api/uploads/image` instead of being proxied to the backend at `http://localhost:3001/api/uploads/image`.

## ✅ Configuration Check

Your configuration is **CORRECT**:

1. ✅ **Vite Proxy** (`vite.config.ts`):
   ```typescript
   proxy: {
     "/api": {
       target: "http://localhost:3001",
       changeOrigin: true,
     },
   }
   ```

2. ✅ **API Client** (`src/lib/api.ts`):
   ```typescript
   baseURL: '/api'  // Uses proxy in development
   ```

3. ✅ **Backend Route** (`server/src/app.ts`):
   ```typescript
   app.use('/api/uploads', uploadRoutes);
   ```

## 🔍 Possible Causes

### 1. Backend Server Not Running

**Check if backend is running:**
```bash
# Should see server running on port 3001
curl http://localhost:3001/api/health
```

**If not running, start it:**
```bash
cd server
npm run dev
```

### 2. Frontend Not Using Proxy

**Restart Vite dev server:**
```bash
# Stop frontend (Ctrl+C)
# Start again
npm run dev
```

**Note:** Vite proxy only works in development mode!

### 3. Port Conflict

**Check if port 3001 is in use:**
```bash
# Windows
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001
```

### 4. CORS Issue

**Check browser console for CORS errors**

If you see CORS errors, verify `server/.env`:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

## 🚀 Quick Fix Steps

### Step 1: Verify Backend is Running

```bash
cd server
npm run dev
```

**Expected output:**
```
[INFO] Server running on port 3001
[INFO] Database connected
```

### Step 2: Verify Frontend is Running

```bash
# In project root
npm run dev
```

**Expected output:**
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

### Step 3: Test Upload Endpoint

**Open browser console and run:**
```javascript
fetch('/api/uploads/health')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** Should return health check response

### Step 4: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try uploading a file
4. Check the request:
   - **URL should be**: `http://localhost:5173/api/uploads/image`
   - **Status should be**: 200 or 201 (not 404)
   - **Response should have**: Cloudinary URL

## 🔧 Alternative: Use Direct Backend URL

If proxy isn't working, you can temporarily use direct backend URL:

**Update `.env` in project root:**
```env
VITE_API_URL=http://localhost:3001
```

**Restart frontend:**
```bash
npm run dev
```

Now requests will go directly to `http://localhost:3001/api/uploads/image`

## 📊 Debugging Checklist

- [ ] Backend server is running on port 3001
- [ ] Frontend server is running on port 5173
- [ ] No CORS errors in browser console
- [ ] `/api` requests are being proxied
- [ ] Upload endpoint returns 200/201 status
- [ ] Cloudinary credentials are set in `server/.env`

## 🧪 Test Upload Manually

**Using curl:**
```bash
curl -X POST http://localhost:3001/api/uploads/image \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/test-image.jpg" \
  -F "folder=test"
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "...",
    ...
  }
}
```

## 🔍 Check Backend Logs

When you try to upload, check the backend terminal for:

**Success:**
```
[INFO] Image uploaded to Cloudinary
  publicId: "consent-forms/photos/..."
  bytes: 123456
```

**Error:**
```
[ERROR] Cloudinary upload failed
  err: { message: "..." }
```

## 🎯 Common Issues & Solutions

### Issue: "Cannot POST /api/uploads/image"

**Solution:** Backend not running or route not registered
```bash
cd server
npm run dev
```

### Issue: "Network Error"

**Solution:** Backend not accessible
- Check backend is running
- Check firewall settings
- Try direct URL in `.env`

### Issue: "CORS Error"

**Solution:** Update CORS origins
```env
# server/.env
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

### Issue: "Cloudinary Error"

**Solution:** Check Cloudinary credentials
```env
# server/.env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## ✅ Verification Steps

After fixing:

1. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

2. **Open consent form:**
   ```
   http://localhost:5173/consent-form
   ```

3. **Try uploading:**
   - Select a photo
   - Check Network tab
   - Should see successful upload
   - Should get Cloudinary URL back

4. **Submit form:**
   - Fill all required fields
   - Submit form
   - Check admin panel
   - Images should be visible

## 🎉 Success Indicators

When working correctly:

- ✅ Upload request goes to `/api/uploads/image`
- ✅ Vite proxy forwards to `localhost:3001`
- ✅ Backend processes upload
- ✅ Cloudinary returns URL
- ✅ Form submission includes image URLs
- ✅ Admin panel displays images

## 📝 Quick Commands

```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Check if frontend proxy works
curl http://localhost:5173/api/health

# Restart backend
cd server && npm run dev

# Restart frontend
npm run dev

# Check backend logs
cd server && npm run dev | grep -i upload
```

## 🆘 Still Not Working?

1. **Check both servers are running**
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Try incognito mode**
4. **Check browser console for errors**
5. **Check backend terminal for errors**
6. **Try direct backend URL** (add `VITE_API_URL=http://localhost:3001` to `.env`)

---

**Most Common Fix:** Just restart both servers! 🔄
