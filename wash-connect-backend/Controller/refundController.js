const pool = require('../db');
const nodemailer = require('nodemailer');

// Dynamically pick service based on sender domain (Yahoo or Gmail)
const senderService = /@yahoo\./i.test(process.env.EMAIL_USER || '') ? 'yahoo' : 'gmail';
const transporter = nodemailer.createTransport({
  service: senderService,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendRefundStatusEmail(to, { status, amount, bookingId, customer }) {
  if (!to) return;
  const subject =
    status === 'Approved'
      ? 'Your refund has been approved'
      : status === 'Rejected'
      ? 'Your refund request was rejected'
      : 'Refund request update';

  const prettyAmount = Number(amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const text =
    status === 'Approved'
      ? `Hello ${customer || ''},

Your refund request for booking ${bookingId} has been approved.
Refund amount: ₱${prettyAmount}.

Please allow a few business days for processing.

Thank you.`
      : `Hello ${customer || ''},

Your refund request for booking ${bookingId} has been ${status.toLowerCase()}.

If you have questions, please contact support.

Thank you.`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
  } catch (e) {
    console.warn('Failed to send refund status email:', e.message);
  }
}

// Helper to fetch customer's email for a booking
async function getBookingEmail(bookingId) {
  try {
    const [[booking]] = await pool.query(
      'SELECT customer_email, user_id FROM bookings WHERE appointment_id = ?',
      [bookingId]
    );
    if (booking && booking.customer_email) return booking.customer_email;
    if (booking && booking.user_id) {
      const [[user]] = await pool.query(
        'SELECT email FROM users WHERE user_id = ?',
        [booking.user_id]
      );
      return user && user.email ? user.email : null;
    }
    return null;
  } catch (e) {
    console.warn('Failed to resolve booking email:', e.message);
    return null;
  }
}

// Create a new refund request
exports.createRefundRequest = async (req, res) => {
  const { customer, amount, reason, bookingId, ownerId } = req.body;
  if (!customer || !amount || !reason || !bookingId || !ownerId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await pool.query(
      `INSERT INTO refunds (customer, amount, reason, bookingId, ownerId, status, requestedAt)
       VALUES (?, ?, ?, ?, ?, 'Pending', NOW())`,
      [customer, amount, reason, bookingId, ownerId]
    );
    res.status(201).json({ message: 'Refund request created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create refund request', details: err.message });
  }
};

// Get all refund requests (for owner)
exports.getRefundRequests = async (req, res) => {
  const { ownerId } = req.query;
  let query = 'SELECT * FROM refunds';
  const params = [];
  if (ownerId) {
    query += ' WHERE ownerId = ?';
    params.push(ownerId);
  }
  query += ' ORDER BY requestedAt DESC';
  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch refund requests', details: err.message });
  }
};

// Update refund request status (sends email on Approved/Rejected)
exports.updateRefundStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // 1) Update refund status
    await pool.query('UPDATE refunds SET status = ? WHERE id = ?', [status, id]);

    // 2) Load refund row
    const [[refund]] = await pool.query(
      'SELECT bookingId, amount, customer FROM refunds WHERE id = ?',
      [id]
    );

    if (refund && refund.bookingId) {
      // 3) If approved, update booking to Refunded/Cancelled
      if (status === 'Approved') {
        await pool.query(
          'UPDATE bookings SET paid_amount = 0, payment_status = "Refunded", status = "Cancelled" WHERE appointment_id = ?',
          [refund.bookingId]
        );
      }

      // 4) Send email notification for Approved/Rejected
      if (status === 'Approved' || status === 'Rejected') {
        const email = await getBookingEmail(refund.bookingId);
        await sendRefundStatusEmail(email, {
          status,
          amount: refund.amount,
          bookingId: refund.bookingId,
          customer: refund.customer,
        });
      }
    }

    res.json({ message: 'Refund status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update refund status', details: err.message });
  }
};

