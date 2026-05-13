import axios from 'axios';

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@deshyatra.com',
      password: 'Admin@123'
    }, {
      withCredentials: true
    });

    console.log('Login successful!');
    console.log('Access Token:', response.data.data.accessToken.substring(0, 50) + '...');
    console.log('User:', response.data.data.user);
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
  }
}

testLogin();