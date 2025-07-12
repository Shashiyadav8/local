export const getLocalIP = async () => {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) {
          // ❗ No candidate found, fallback to localhost
          resolve('127.0.0.1');
          return;
        }

        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const match = event.candidate.candidate.match(ipRegex);
        if (match) {
          resolve(match[1]);
        } else {
          resolve('127.0.0.1'); // No match, fallback
        }
      };

      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch((err) => {
          console.error('Offer error:', err);
          resolve('127.0.0.1');
        });

      // Safety timeout
      setTimeout(() => resolve('127.0.0.1'), 3000);
    } catch (err) {
      console.error('getLocalIP Error:', err);
      resolve('127.0.0.1');
    }
  });
};
