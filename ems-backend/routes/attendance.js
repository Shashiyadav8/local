const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Parser } = require('json2csv');

const authenticate = require('../middleware/authenticate');
const checkOfficeIP = require('../middleware/checkOfficeIP');
const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');

// Multer setup for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `photo-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Helper to normalize IP format
const normalizeIP = (ip = '') =>
  ip.replace(/\s+/g, '').replace('::ffff:', '').replace('::1', '127.0.0.1');

// ✅ Punch In / Punch Out Route
router.post('/punch', authenticate, upload.single('photo'), checkOfficeIP, async (req, res) => {
  const empId = req.user._id;
  const empCode = req.user.employee_id;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  const forwarded = req.headers['x-forwarded-for'] || '';
  const remote = req.socket.remoteAddress || '';
  const localIPFromClient = req.body?.localIP || '';

  const forwardedIPs = forwarded.split(',').map(normalizeIP);
  const remoteIP = normalizeIP(remote);
  const primaryIP = forwardedIPs[0] || remoteIP;
  const normalizedLocalIP = normalizeIP(localIPFromClient);

  const photoPath = req.file?.path?.replace(/\\/g, '/') || '';

  console.log('------------------------------------------');
  console.log(`📌 Punch attempt by ${empCode}`);
  console.log(`📡 Forwarded IPs: ${forwarded}`);
  console.log(`🌐 Remote IP: ${remote}`);
  console.log(`✅ Normalized Primary IP: ${primaryIP}`);
  console.log(`📱 Local IP from device: ${normalizedLocalIP}`);
  console.log('------------------------------------------');

  try {
    let record = await Attendance.findOne({ employee_ref: empId, date: today });

    // ✅ Punch In
    if (!record) {
      if (!photoPath) {
        return res.status(400).json({ message: 'Photo is required for Punch In.' });
      }

      await Attendance.create({
        employee_ref: empId,
        employee_id: empCode,
        date: today,
        punch_in_time: now,
        ip: primaryIP,
        photo_path: photoPath,
      });

      console.log(`✅ Punch In recorded for ${empCode} at ${now.toLocaleTimeString()}`);
      return res.json({ message: '✅ Punch In successful', type: 'in' });
    }

    // ✅ Punch Out
    if (!record.punch_out_time) {
      record.punch_out_time = now;
      record.ip = primaryIP;
      if (photoPath) record.photo_path = photoPath;
      await record.save();

      console.log(`✅ Punch Out recorded for ${empCode} at ${now.toLocaleTimeString()}`);
      return res.json({ message: '✅ Punch Out successful', type: 'out' });
    }

    // ❌ Already punched in & out
    return res.status(400).json({ message: '⚠️ Already punched in and out today.' });
  } catch (err) {
    console.error('❌ Punch error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ Attendance status route
router.get('/status', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({
      employee_ref: req.user._id,
      date: today,
    });

    res.json({
      punch_in: record?.punch_in_time || null,
      punch_out: record?.punch_out_time || null,
    });
  } catch (err) {
    console.error('Status fetch error:', err);
    res.status(500).json({ message: 'Unable to fetch punch status' });
  }
});

// ✅ CSV Export Route
router.get('/export', authenticate, async (req, res) => {
  try {
    const records = await Attendance.find({});
    if (!records.length) return res.status(404).json({ message: 'No attendance records found' });

    const data = records.map(r => ({
      id: r._id,
      employee_id: r.employee_id || 'N/A',
      date: r.date,
      punch_in: r.punch_in_time,
      punch_out: r.punch_out_time,
      ip: r.ip || '',
    }));

    const csv = new Parser().parse(data);
    res.header('Content-Type', 'text/csv').attachment('attendance.csv').send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ message: 'Failed to generate CSV' });
  }
});

// ✅ Admin: View all attendance records
router.get('/attendance-records', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }

  try {
    const records = await Attendance.find({})
      .populate({ path: 'employee_ref', select: 'name employee_id', strictPopulate: false })
      .sort({ date: -1 });

    const data = records.map(r => ({
      id: r._id,
      employee_id: r.employee_id || r.employee_ref?.employee_id || 'N/A',
      employee_name: r.employee_ref?.name || 'N/A',
      ip: r.ip || '',
      date: r.date,
      punch_in_time: r.punch_in_time || '',
      punch_out_time: r.punch_out_time || '',
      photo_path: r.photo_path || '',
    }));

    res.json(data);
  } catch (err) {
    console.error('Admin fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch attendance records' });
  }
});

// ✅ View Selfie Photo (Admin only)
router.get('/photo/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }

  try {
    const record = await Attendance.findById(req.params.id);
    if (!record?.photo_path) return res.status(404).json({ message: 'Photo not found' });

    const fullPath = path.join(__dirname, '..', record.photo_path);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'File missing' });

    res.sendFile(fullPath);
  } catch (err) {
    console.error('❌ Photo fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch photo' });
  }
});

module.exports = router;
