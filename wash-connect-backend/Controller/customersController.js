const pool = require('../db');

// One row per customer with completedBookings and status (Repeat/New)
exports.getCustomersByApplication = async (req, res) => {
  const { applicationId } = req.params;
  if (!applicationId) return res.status(400).json({ error: 'Missing applicationId' });

  // Build a set of query variants to handle different schemas across environments
  const buildQueries = () => {
    const bAppCols = ['applicationId', 'application_id'];
    const bStatusCols = ['status', 'booking_status'];
    const uIdCols = ['user_id', 'id'];
    const includeAddressAvatar = [true, false]; // if users.address/users.avatar don't exist

    const queries = [];
    for (const appCol of bAppCols) {
      for (const statusCol of bStatusCols) {
        for (const uIdCol of uIdCols) {
          for (const includeExtras of includeAddressAvatar) {
            const addressSel = includeExtras ? 'u.address' : 'NULL';
            const avatarSel = includeExtras ? 'u.avatar' : 'NULL';
            const q = `
              SELECT
                cb.user_id,
                u.first_name  AS customer_first_name,
                u.last_name   AS customer_last_name,
                u.email       AS customer_email,
                ${addressSel} AS address,
                ${avatarSel}  AS avatar,
                cb.completedBookings,
                cb.latest_completed_booking
              FROM (
                SELECT 
                  b.user_id,
                  COUNT(*) AS completedBookings,
                  MAX(COALESCE(b.updated_at, b.created_at)) AS latest_completed_booking
                FROM bookings b
                WHERE b.${appCol} = ?
                  AND LOWER(b.${statusCol}) IN ('completed','done')
                GROUP BY b.user_id
              ) AS cb
              LEFT JOIN users u ON u.${uIdCol} = cb.user_id
            `;
            queries.push(q);
          }
        }
      }
    }
    return queries;
  };

  try {
    const queries = buildQueries();
    let rows = null;
    let lastErr = null;

    for (const q of queries) {
      try {
        const [r] = await pool.query(q, [applicationId]);
        rows = r;
        break;
      } catch (e) {
        // Try next variant on ER_BAD_FIELD_ERROR or ER_NO_SUCH_TABLE; otherwise stop
        lastErr = e;
        if (e && (e.code === 'ER_BAD_FIELD_ERROR' || e.code === 'ER_NO_SUCH_TABLE')) {
          continue;
        } else {
          break;
        }
      }
    }

    if (!rows) {
      console.error('getCustomersByApplication failed all query variants:', lastErr);
      return res.status(500).json({
        error: 'Failed to load customers',
        details: lastErr?.sqlMessage || lastErr?.message || 'Unknown error',
      });
    }

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
    console.error('getCustomersByApplication error:', e);
    res.status(500).json({ error: 'Failed to load customers', details: e.message });
  }
};