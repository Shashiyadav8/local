// src/Components/loginpage/loginpage/utils/getLocalIP.js

export const getLocalIP = async () => {
  const HELPER_URL = 'https://loca-1.onrender.com/api/ip'; // ✅ Your hosted helper

  try {
    console.log(`🌐 Trying to fetch local IP from: ${HELPER_URL}`);

    const res = await fetch(HELPER_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('⚠️ IP Helper error - status:', res.status);
      return '127.0.0.1';
    }

    const data = await res.json();

    if (data && data.ip) {
      console.log('📡 Local IP from helper:', data.ip);
      return data.ip;
    } else {
      console.warn('⚠️ IP Helper returned invalid structure:', data);
      return '127.0.0.1';
    }
  } catch (error) {
    console.error('❌ Local IP fetch failed:', error.message);
    return '127.0.0.1';
  }
};
