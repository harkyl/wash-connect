const db = require('../db'); // This now imports the promise-based pool

const createReport = async (req, res) => { // <-- Make the function async
  const { applicationId, user_id, reason } = req.body;

  if (!applicationId || !user_id || !reason) {
    return res.status(400).json({ message: 'Missing required fields: applicationId, user_id, and reason are required.' });
  }

  const query = 'INSERT INTO reports (applicationId, user_id, reason, status) VALUES (?, ?, ?, ?)';
  const status = 'pending';

  try {
    // Use await to execute the query and wait for the result
    const [result] = await db.execute(query, [applicationId, user_id, reason, status]);

    // If the query is successful, send the response
    res.status(201).json({ message: 'Report submitted successfully.', reportId: result.insertId });

  } catch (err) {
    // If any error occurs during the await, it will be caught here
    console.error('Error creating report:', err);
    res.status(500).json({ message: 'Failed to submit report due to a server error.' });
  }
};

const getReportsByShop = async (req, res) => {
  const { shopId } = req.params;

  const query = `
    SELECT r.report_id, r.reason, r.created_at, r.status, u.first_name, u.last_name
    FROM reports r
    JOIN users u ON r.user_id = u.user_id
    WHERE r.applicationId = ?
    ORDER BY r.created_at DESC
  `;

  try {
    const [reports] = await db.execute(query, [shopId]);
    const formattedReports = reports.map(report => ({
      id: report.report_id,
      customerName: `${report.first_name} ${report.last_name}`,
      reason: report.reason,
      createdAt: report.created_at,
      status: report.status
    }));
    res.json(formattedReports);
  } catch (err) {
    console.error('Error fetching reports by shop:', err);
    res.status(500).json({ message: 'Failed to fetch reports.' });
  }
};

const resolveReport = async (req, res) => {
  const { reportId } = req.params;

  const query = 'UPDATE reports SET status = ? WHERE report_id = ?';
  const status = 'resolved';

  try {
    const [result] = await db.execute(query, [status, reportId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Report not found.' });
    }
    res.status(200).json({ message: 'Report resolved successfully.' });
  } catch (err) {
    console.error('Error resolving report:', err);
    res.status(500).json({ message: 'Failed to resolve report.' });
  }
};

const createCustomerReport = async (req, res) => {
  // Use owner_id and user_id to match the table schema
  const { owner_id, user_id, reason } = req.body;

  if (!owner_id || !user_id || !reason) {
    return res.status(400).json({ message: 'Missing required fields: owner_id, user_id, and reason are required.' });
  }

  // Update the query to use the correct column names
  const query = 'INSERT INTO customer_reports (owner_id, user_id, reason) VALUES (?, ?, ?)';

  try {
    // Pass the correct variables to the query
    const [result] = await db.execute(query, [owner_id, user_id, reason]);
    res.status(201).json({ message: 'Customer report submitted successfully.', reportId: result.insertId });
  } catch (err) {
    console.error('Error creating customer report:', err);
    res.status(500).json({ message: 'Failed to submit customer report due to a server error.' });
  }
};

const getCustomerReports = async (req, res) => {
  const query = `
    SELECT
        cr.report_id,
        cr.reason,
        cr.created_at AS report_date,
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.address,
        u.status AS user_status,
        co.owner_first_name,
        co.owner_last_name
    FROM
        customer_reports cr
    JOIN
        users u ON cr.user_id = u.user_id
    JOIN
        carwash_owners co ON cr.owner_id = co.owner_id
    ORDER BY
        cr.created_at DESC;
  `;
  try {
    const [reports] = await db.execute(query);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reported customers:', error);
    res.status(500).json({ message: 'Failed to fetch reported customers.' });
  }
};


module.exports = {
  createReport,
  getReportsByShop,
  resolveReport,
  createCustomerReport,
  getCustomerReports,
};