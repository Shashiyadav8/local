// src/Components/loginpage/loginpage/utils/getLocalIP.js

export const getLocalIP = async () => {
  try {
    const res = await fetch('https://loca-z5qy.onrender.com/api/ip', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('🌐 IP Helper error status:', res.status);
      return '127.0.0.1';
    }

    const data = await res.json();
    if (data && data.ip) {
      console.log('📡 Local IP from helper:', data.ip);
      return data.ip;
    } else {
      console.warn('⚠️ IP Helper returned invalid response');
      return '127.0.0.1';
    }
  } catch (error) {
    console.error('❌ Local IP fetch error:', error.message);
    return '127.0.0.1';
  }
};
