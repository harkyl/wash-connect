const pool = require('../db');

// One row per customer with completedBookings and status (Repeat/New)
exports.getCustomersByApplication = async (req, res) => {
  const { applicationId } = req.params;
  if (!applicationId) return res.status(400).json({ error: 'Missing applicationId' });

  // Build a set of query variants to handle different schemas across environments
  const buildQueries = () => {
    const bAppCols = ['applicationId', 'application_id'];
    const bStatusCols = ['status', 'booking_status'];
    const bUserIdCols = ['user_id', 'userId']; // bookings user id variants
    const tsAggs = [
      'MAX(COALESCE(b.updated_at, b.created_at))',
      'MAX(COALESCE(b.updatedAt, b.createdAt))',
      'MAX(COALESCE(b.schedule_date, b.created_at))',
      'MAX(COALESCE(b.scheduleDate, b.createdAt))',
    ];

    const uIdCols = ['user_id', 'id'];        // users PK variants
    const includeAddressAvatar = [true, false];
    const includeUsersJoin = [true, false];    // allow no users table

    const queries = [];
    for (const appCol of bAppCols) {
      for (const statusCol of bStatusCols) {
        for (const bUserIdCol of bUserIdCols) {
          for (const tsAgg of tsAggs) {
            for (const joinUsers of includeUsersJoin) {
              if (joinUsers) {
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
                          b.${bUserIdCol} AS user_id,
                          COUNT(*) AS completedBookings,
                          ${tsAgg} AS latest_completed_booking
                        FROM bookings b
                        WHERE b.${appCol} = ?
                          AND LOWER(b.${statusCol}) IN ('completed','done')
                        GROUP BY b.${bUserIdCol}
                      ) AS cb
                      LEFT JOIN users u ON u.${uIdCol} = cb.user_id
                    `;
                    queries.push(q);
                  }
                }
              } else {
                // Variant without users join
                const q = `
                  SELECT
                    cb.user_id,
                    NULL AS customer_first_name,
                    NULL AS customer_last_name,
                    NULL AS customer_email,
                    NULL AS address,
                    NULL AS avatar,
                    cb.completedBookings,
                    cb.latest_completed_booking
                  FROM (
                    SELECT 
                      b.${bUserIdCol} AS user_id,
                      COUNT(*) AS completedBookings,
                      ${tsAgg} AS latest_completed_booking
                    FROM bookings b
                    WHERE b.${appCol} = ?
                      AND LOWER(b.${statusCol}) IN ('completed','done')
                    GROUP BY b.${bUserIdCol}
                  ) AS cb
                `;
                queries.push(q);
              }
            }
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
    let usedVariant = -1;

    for (let i = 0; i < queries.length; i++) {
      const q = queries[i];
      try {
        const [r] = await pool.query(q, [applicationId]);
        rows = r;
        usedVariant = i;
        break;
      } catch (e) {
        lastErr = e;
        if (e && (e.code === 'ER_BAD_FIELD_ERROR' || e.code === 'ER_NO_SUCH_TABLE')) {
          continue; // try next variant
        } else {
          break;    // other errors (e.g., auth/connection) won't be fixed by variants
        }
      }
    }

    if (!rows) {
      console.error('getCustomersByApplication failed all variants:', {
        code: lastErr?.code, message: lastErr?.sqlMessage || lastErr?.message
      });
      return res.status(500).json({
        error: 'Failed to load customers',
        details: lastErr?.sqlMessage || lastErr?.message || 'Unknown error',
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`getCustomersByApplication used query variant #${usedVariant}, returned ${rows.length} rows`);
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