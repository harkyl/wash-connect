const db = require('../db'); // Assuming you have a db.js for database connection

const createReport = (req, res) => {
  const { applicationId, user_id, reason } = req.body;

  if (!applicationId || !user_id || !reason) {
    return res.status(400).json({ message: 'Missing required fields: applicationId, user_id, and reason are required.' });
  }

  const query = 'INSERT INTO reports (applicationId, user_id, reason, status) VALUES (?, ?, ?, ?)';
  const status = 'pending'; // Default status

  db.query(query, [applicationId, user_id, reason, status], (err, result) => {
    if (err) {
      console.error('Error creating report:', err);
      return res.status(500).json({ message: 'Failed to submit report due to a server error.' });
    }
    // This is the crucial part: send a JSON response on success.
    res.status(201).json({ message: 'Report submitted successfully.', reportId: result.insertId });
  });
};

module.exports = {
  createReport,
};