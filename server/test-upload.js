import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const cwd = process.cwd();
const imagePath = path.join(cwd, 'test-image.png');
const imageBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=', 'base64');
fs.writeFileSync(imagePath, imageBytes);

async function main() {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@deshyatra.com', password: 'Admin@123' }),
  });
  const loginData = await loginRes.json();
  console.log('login status', loginRes.status, loginData);

  const token = loginData.data?.accessToken;
  if (!token) {
    console.error('No access token');
    process.exit(1);
  }

  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));

  const uploadRes = await fetch('http://localhost:3001/api/uploads/single', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders(),
    },
    body: form,
  });
  const uploadData = await uploadRes.json();
  console.log('upload status', uploadRes.status, uploadData);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});