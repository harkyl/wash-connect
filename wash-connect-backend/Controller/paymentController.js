const pool = require('../db');
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Helper: get current total paid for an appointment (optional)
async function getTotalPaid(appointmentId) {
  const [rows] = await pool.query(
    'SELECT COALESCE(SUM(amount),0) AS total_paid FROM payments WHERE appointment_id = ?',
    [appointmentId]
  );
  return rows[0]?.total_paid || 0;
}

// NEW: Helper to get carwash name by appointmentId
async function getCarwashNameByAppointment(appointmentId) {
  const [rows] = await pool.query(
    `SELECT a.carwashName
       FROM bookings b
       JOIN carwash_applications a ON a.applicationId = b.applicationId
      WHERE b.appointment_id = ?
      LIMIT 1`,
    [appointmentId]
  );
  return rows[0]?.carwashName || null;
}

// Send email notification about payment status
async function sendPaymentEmail(to, customerName, carwashName, status, amount) {
  const subject = `Your payment for ${carwashName}`;
  const text = `Hello ${customerName},

Your booking at ${carwashName} is now marked as "${status}".
Amount ${status === "Partial" ? "partially paid" : "fully paid"}: ₱${amount}

Thank you for using WashConnect!`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
}

exports.createPayment = async (req, res) => {
  const { appointmentId } = req.params;
  let { user_id, amount, method, receipt_url, payment_status } = req.body;

  if (!user_id || !amount || !method) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  amount = parseFloat(amount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  try {
    // OPTIONAL: derive payment_status based on total so far (remove if you always pass it from frontend)
    if (!payment_status) {
      const beforeTotal = await getTotalPaid(appointmentId);
      const afterTotal = beforeTotal + amount;
      // You can define your own rule; leaving as Partial unless frontend sends Paid
      payment_status = 'Partial';
      // Example: if frontend also sends expected total target, you could compare there.
    }

    const tax = amount * 0.10;
    await pool.query(
      "INSERT INTO payments (appointment_id, user_id, amount, method, payment_status, tax) VALUES (?, ?, ?, ?, ?, ?)",
      [appointmentId, user_id, amount, method, payment_status, tax]
    );

    await pool.query('UPDATE bookings SET payment_status = ? WHERE appointment_id = ?', [payment_status, appointmentId]);

    // Fetch customer and real carwash name for email
    const [userRows] = await pool.query("SELECT first_name, last_name, email FROM users WHERE user_id = ?", [user_id]);
    const customer = userRows[0];
    if (customer) {
      const carwashName = (await getCarwashNameByAppointment(appointmentId)) || "Carwash";
      await sendPaymentEmail(
        customer.email,
        `${customer.first_name} ${customer.last_name}`,
        carwashName,
        payment_status,
        amount
      );
    }

    res.status(201).json({ success: true, message: 'Payment recorded.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record payment', details: error.message });
  }
};

exports.updatePayment = async (req, res) => {
  const { appointmentId } = req.params;
  let { user_id, amount, method, receipt_url, payment_status } = req.body;

  if (!user_id || !amount || !method) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  amount = parseFloat(amount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  try {
    if (!payment_status) {
      const beforeTotal = await getTotalPaid(appointmentId);
      const afterTotal = beforeTotal + amount;
      payment_status = 'Partial';
    }

    await pool.query(
      'INSERT INTO payments (appointment_id, user_id, amount, method, receipt_url, payment_status) VALUES (?, ?, ?, ?, ?, ?)',
      [appointmentId, user_id, amount, method, receipt_url || null, payment_status]
    );

    await pool.query('UPDATE bookings SET payment_status = ? WHERE appointment_id = ?', [payment_status, appointmentId]);

    const [userRows] = await pool.query("SELECT first_name, last_name, email FROM users WHERE user_id = ?", [user_id]);
    const customer = userRows[0];
    if (customer) {
      const carwashName = (await getCarwashNameByAppointment(appointmentId)) || "Carwash";
      await sendPaymentEmail(
        customer.email,
        `${customer.first_name} ${customer.last_name}`,
        carwashName,
        payment_status,
        amount
      );
    }

    res.json({ success: true, message: 'Additional payment recorded.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update payment', details: error.message });
  }
};

// GET: All payments for a given carwash application (shop)
// Joins payments -> bookings (by appointment_id) and users (by user_id)
exports.getPaymentsByApplication = async (req, res) => {
  const { applicationId } = req.params;
  if (!applicationId) return res.status(400).json({ error: 'applicationId is required' });

  try {
    const [rows] = await pool.query(
      `SELECT 
          p.payment_id,
          p.appointment_id,
          p.user_id,
          p.amount,
          p.method,
          p.receipt_url,
          p.payment_status,
          p.created_at,
          b.applicationId,
          b.service_name,
          b.schedule_date,
          b.price AS booking_price,
          b.status AS booking_status,
          u.first_name AS customer_first_name,
          u.last_name AS customer_last_name,
          u.email AS customer_email,
          a.carwashName                       -- NEW
        FROM payments p
        JOIN bookings b ON p.appointment_id = b.appointment_id
        LEFT JOIN users u ON p.user_id = u.user_id
        LEFT JOIN carwash_applications a ON a.applicationId = b.applicationId   -- NEW
       WHERE b.applicationId = ?
       ORDER BY p.appointment_id DESC`,
      [applicationId]
    );

    const [totals] = await pool.query(
      `SELECT 
          COALESCE(SUM(p.amount),0) AS total_amount,
          SUM(CASE WHEN p.payment_status = 'Refunded' THEN p.amount ELSE 0 END) AS total_refunded,
          SUM(CASE WHEN p.payment_status IN ('Paid') THEN p.amount ELSE 0 END) AS total_paid
       FROM payments p
       JOIN bookings b ON p.appointment_id = b.appointment_id
      WHERE b.applicationId = ?`,
      [applicationId]
    );

    res.json({ payments: rows, summary: totals?.[0] || { total_amount: 0, total_refunded: 0, total_paid: 0 } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch payments', details: error.message });
  }
};

// GET /api/payments/by-appointment/:appointmentId
exports.getPaymentByAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM payments WHERE appointment_id = ?", [appointmentId]);
    res.json({ payment: rows }); // returns all payments for that appointment
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// GET: All payments of all services (for admin) WITH shop name
exports.getAllPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        p.payment_id,
        p.appointment_id,
        p.user_id,
        p.amount,
        p.method,
        p.receipt_url,
        p.payment_status,
        p.created_at AS date,
        b.applicationId,                     -- NEW
        b.service_name,
        b.price AS booking_price,
        b.status AS booking_status,
        a.carwashName                         -- NEW
      FROM payments p
      JOIN bookings b ON p.appointment_id = b.appointment_id
      LEFT JOIN carwash_applications a ON a.applicationId = b.applicationId   -- NEW
      ORDER BY p.payment_id DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch all payments', details: error.message });
  }
};

// Example: PATCH /api/bookings/:id/payment
exports.updatePaymentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, amount } = req.body; // status: "Partial" or "Paid"
  try {
    await pool.query(
      "UPDATE bookings SET payment_status = ?, paid_amount = ? WHERE appointment_id = ?",
      [status, amount, id]
    );

    // Get customer info and carwash name
    const [rows] = await pool.query(
      `SELECT b.customer_email, b.customer_name, ca.carwashName
       FROM bookings b
       JOIN carwash_applications ca ON b.applicationId = ca.applicationId
       WHERE b.appointment_id = ? LIMIT 1`,
      [id]
    );
    if (rows.length && (status === "Partial" || status === "Paid")) {
      await sendPaymentEmail(
        rows[0].customer_email,
        rows[0].customer_name,
        rows[0].carwashName,
        status,
        amount
      );
    }

    res.json({ message: "Payment status updated." });
  } catch (error) {
    res.status(500).json({ error: "Failed to update payment status", details: error.message });
  }
};