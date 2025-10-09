const pool = require('../db');

exports.submitFeedback = async (req, res) => {
    const { appointmentId } = req.params;
    const { user_id, rating, comment } = req.body;

    // Validate appointmentId is a positive integer
    const appointmentIdNum = Number(appointmentId);
    if (!Number.isInteger(appointmentIdNum) || appointmentIdNum <= 0) {
        return res.status(400).json({ error: 'Invalid appointment ID.' });
    }

    // Validate required fields
    if (!rating || !user_id) {
        return res.status(400).json({ error: 'Rating and user_id are required.' });
    }

    // Validate rating is a number (optional: check range)
    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
    }

    try {
        // Fetch user's name from users table
        const [userRows] = await pool.query(
            "SELECT first_name, last_name FROM users WHERE user_id = ?",
            [user_id]
        );
        if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }
        const customer_name = `${userRows[0].first_name} ${userRows[0].last_name}`;

        // Check if feedback already exists for this user and appointment
        const [existing] = await pool.query(
            "SELECT * FROM booking_feedbacks WHERE appointment_id = ? AND customer_name = ?",
            [appointmentIdNum, customer_name]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: "Feedback already submitted for this booking." });
        }

        // Insert feedback (update table name if needed)
        await pool.query(
            "INSERT INTO booking_feedbacks (appointment_id, customer_name, rating, comment) VALUES (?, ?, ?, ?)",
            [appointmentIdNum, customer_name, ratingNum, comment]
        );
        res.json({ success: true, message: "Feedback submitted!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save feedback.", details: err.message });
    }
};

exports.getReviewsByApplication = async (req, res) => {
    const { applicationId } = req.params;
    if (!applicationId || isNaN(Number(applicationId))) {
        return res.status(400).json({ error: "Invalid application ID." });
    }
    try {
        const [rows] = await pool.query(
            `SELECT 
                bf.*, 
                b.service_name,
                u.avatar AS customer_avatar
             FROM booking_feedbacks bf
             JOIN bookings b ON bf.appointment_id = b.appointment_id
             LEFT JOIN users u ON b.user_id = u.user_id
             WHERE b.applicationId = ?`,
            [applicationId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch reviews.", details: err.message });
    }
};
