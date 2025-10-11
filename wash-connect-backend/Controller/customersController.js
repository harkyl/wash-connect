const pool = require('../db');

// GET /api/customers/by-application/:applicationId
// One row per customer with completedBookings and status (Repeat/New)
exports.getCustomersByApplication = async (req, res) => {
  const { applicationId } = req.params;
  if (!applicationId) return res.status(400).json({ error: 'Missing applicationId' });

  try {
    const [rows] = await pool.query(
      `SELECT 
         b.user_id,
         u.first_name  AS customer_first_name,
         u.last_name   AS customer_last_name,
         u.email       AS customer_email,
         u.address,
         u.avatar      AS avatar,
         COUNT(*)      AS completedBookings,
         MAX(COALESCE(b.updated_at, b.created_at)) AS latest_completed_booking
       FROM bookings b
       LEFT JOIN users u ON u.user_id = b.user_id
       WHERE b.applicationId = ?
         AND LOWER(b.status) IN ('completed','done')
       GROUP BY b.user_id`,
      [applicationId]
    );

    const data = rows.map(r => ({
      user_id: r.user_id,
      customer_first_name: r.customer_first_name || '',
      customer_last_name: r.customer_last_name || '',
      customer_email: r.customer_email || '',
      address: r.address || '',
      avatar: r.avatar || '',
      completedBookings: Number(r.completedBookings || 0),
      latest_completed_booking: r.latest_completed_booking || null,
      status: Number(r.completedBookings || 0) >= 2 ? 'Repeat Customer' : 'New Customer',
      latest_for_sort: r.latest_completed_booking || null,
    }));

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load customers', details: e.message });
  }
};