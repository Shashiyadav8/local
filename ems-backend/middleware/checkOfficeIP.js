const AdminSettings = require('../models/AdminSettings');

const normalizeIP = (ip = '') =>
  ip.replace(/\s+/g, '').replace('::ffff:', '').replace('::1', '127.0.0.1').trim();

module.exports = async (req, res, next) => {
  try {
    const rawHeader = req.headers['x-forwarded-for'] || '';
    const rawIP = rawHeader || req.socket.remoteAddress || '';
    const forwardedIPs = rawIP.split(',').map(normalizeIP);
    const clientIP = forwardedIPs[0];

    const localIPFromClient = normalizeIP(req.body.localIP || '');

    console.log('------------------------------------------');
    console.log(`🔍 Raw x-forwarded-for: ${rawHeader}`);
    console.log(`🔍 Raw IP fallback: ${req.socket.remoteAddress}`);
    console.log(`🔍 Normalized Client IP: ${clientIP}`);
    console.log(`🔍 All Forwarded IPs: ${forwardedIPs.join(', ')}`);
    console.log(`📱 Local IP from client device: ${localIPFromClient}`);

    // Allow localhost (127.0.0.1) in development
    if (forwardedIPs.includes('127.0.0.1')) {
      console.log('🛠 Localhost detected — skipping restriction.');
      req.networkCheck = {
        clientIP,
        localIP: localIPFromClient,
        ipAllowed: true,
        deviceAllowed: true,
      };
      return next();
    }

    const settings = await AdminSettings.findOne();
    if (!settings) {
      return res.status(500).json({ message: 'Admin settings not configured' });
    }

    const allowed_ips = (Array.isArray(settings.allowed_ips)
      ? settings.allowed_ips
      : String(settings.allowed_ips).split(',')
    ).map(normalizeIP).filter(Boolean);

    const allowed_devices = (Array.isArray(settings.allowed_devices)
      ? settings.allowed_devices
      : String(settings.allowed_devices).split(',')
    ).map(normalizeIP).filter(Boolean);

    const ipAllowed = forwardedIPs.some(ip => allowed_ips.includes(ip));
    const deviceAllowed = allowed_devices.includes(localIPFromClient);

    req.networkCheck = {
      clientIP,
      localIP: localIPFromClient,
      ipAllowed,
      deviceAllowed,
    };

    console.log(`✅ Allowed WiFi IPs: ${allowed_ips.join(', ')}`);
    console.log(`✅ Allowed Device IPs: ${allowed_devices.join(', ')}`);
    console.log(`✅ Match result: IP Allowed = ${ipAllowed}, Device Allowed = ${deviceAllowed}`);
    console.log('------------------------------------------');

    if (!ipAllowed && !deviceAllowed) {
      return res.status(403).json({
        message: 'Access denied. Not on allowed WiFi or device.',
        clientIP,
        localIP: localIPFromClient,
        ipAllowed,
        deviceAllowed,
      });
    }

    next();
  } catch (err) {
    console.error('❌ checkOfficeIP Error:', err);
    res.status(500).json({ message: 'Internal server error during IP check' });
  }
};
