// src/Components/loginpage/loginpage/utils/getLocalIP.js

export const getLocalIP = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/ip', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn('Local IP helper returned an error status:', res.status);
      return '127.0.0.1';
    }

    const data = await res.json();
    if (data && data.ip) {
      console.log('📡 Local IP from helper:', data.ip);
      return data.ip;
    } else {
      console.warn('⚠️ Helper returned invalid IP response');
      return '127.0.0.1';
    }
  } catch (error) {
    console.error('❌ Failed to fetch local IP from helper:', error);
    return '127.0.0.1';
  }
};
