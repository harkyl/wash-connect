const pool = require('../db');

// GET /api/owners/:id/phone
exports.getOwnerPhone = async (req, res) => {
  const { id } = req.params;
  try {
    const [[row]] = await pool.query(
      'SELECT owner_phone FROM carwash_owners WHERE owner_id = ? LIMIT 1',
      [id]
    );
    if (!row) return res.status(404).json({ error: 'Owner not found' });
    res.json({ owner_phone: row.owner_phone });
  } catch (e) {
    console.error('getOwnerPhone error:', e);
    res.status(500).json({ error: 'Failed to fetch owner phone' });
  }
};

// Generic detector for column names
async function detectColumn(table, candidates) {
  try {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME IN (${candidates.map(() => '?').join(',')})
       LIMIT 1`,
      [table, ...candidates]
    );
    return rows[0]?.COLUMN_NAME || candidates[0];
  } catch {
    return candidates[0];
  }
}

let appIdCol = null;
let ownerIdCol = null;
async function getAppIdColumn() {
  if (!appIdCol) appIdCol = await detectColumn('carwash_applications', ['applicationId', 'application_id']);
  return appIdCol;
}
async function getOwnerIdColumn() {
  if (!ownerIdCol) ownerIdCol = await detectColumn('carwash_applications', ['ownerId', 'owner_id']);
  return ownerIdCol;
}

// GET /api/applications/:applicationId/owner-phone
exports.getOwnerPhoneByApplication = async (req, res) => {
  const { applicationId } = req.params;
  try {
    const appCol = await getAppIdColumn();
    const ownerCol = await getOwnerIdColumn();

    const [appRows] = await pool.query(
      `SELECT ${ownerCol} AS ownerId
       FROM carwash_applications
       WHERE ${appCol} = ?
       LIMIT 1`,
      [applicationId]
    );

    const ownerId = appRows[0]?.ownerId;
    if (!ownerId) return res.status(404).json({ error: 'Owner not found for application' });

    const [[owner]] = await pool.query(
      'SELECT owner_phone FROM carwash_owners WHERE owner_id = ? LIMIT 1',
      [ownerId]
    );
    if (!owner) return res.status(404).json({ error: 'Owner not found' });

    res.json({ owner_id: ownerId, owner_phone: owner.owner_phone });
  } catch (e) {
    console.error('getOwnerPhoneByApplication error:', e);
    res.status(500).json({ error: 'Failed to fetch owner phone' });
  }
};