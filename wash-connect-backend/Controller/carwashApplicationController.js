const pool = require('../db');

exports.submitApplication = async (req, res) => {
	const { ownerId, carwashName, location } = req.body;
	const logo = req.files['logo'] ? req.files['logo'][0].filename : null;
	const requirements = req.files['requirements'] ? req.files['requirements'][0].filename : null;

	if (!ownerId || !carwashName || !location) {
		return res.status(400).json({ error: 'Missing required fields' });
	}

	try {
		await pool.query(
			'INSERT INTO carwash_applications (ownerId, carwashName, location, logo, requirements) VALUES (?, ?, ?, ?, ?)',
			[ownerId, carwashName, location, logo, requirements]
		);
		res.status(201).json({ message: 'Application submitted successfully' });
	} catch (error) {
		res.status(500).json({ error: 'Failed to submit application', details: error.message });
	}
};

exports.getApplicationStatus = async (req, res) => {
	const { ownerId } = req.params;
	try {
		const [rows] = await pool.query(
			'SELECT applicationId, status FROM carwash_applications WHERE ownerId = ? ORDER BY applicationId DESC LIMIT 1',
			[ownerId]
		);
		if (rows.length > 0) {
			return res.json({ registered: true, status: rows[0].status });
		} else {
			return res.json({ registered: false, status: null });
		}
	} catch (error) {
		res.status(500).json({ error: 'Failed to check registration status', details: error.message });
	}
};

exports.getApplicationByOwner = async (req, res) => {
	const { ownerId } = req.params;
	try {
		const [rows] = await pool.query(
			'SELECT applicationId, carwashName, location, logo FROM carwash_applications WHERE ownerId = ? LIMIT 1',
			[ownerId]
		);
		if (rows.length > 0) {
			res.json(rows[0]);
		} else {
			res.status(404).json({ error: "No application found" });
		}
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch application', details: error.message });
	}
};

exports.getApplicationById = async (req, res) => {
	const applicationId = req.params.applicationId || req.params.id; // FIX: read applicationId
	if (!applicationId) return res.status(400).json({ error: 'Missing applicationId' });
	try {
		const [rows] = await pool.query(
			`SELECT applicationId, ownerId, carwashName, logo, location, status, created_at, updated_at
			 FROM carwash_applications
			 WHERE applicationId = ?
			 LIMIT 1`,
			[applicationId]
		);
		if (!rows[0]) return res.status(404).json({ error: "Application not found" });
		res.json(rows[0]);
	} catch (e) {
		res.status(500).json({ error: "Failed to load application", details: e.message });
	}
};

exports.getApprovedApplications = async (req, res) => {
	try {
		const [rows] = await pool.query(
			'SELECT applicationId, ownerId, carwashName, location, logo FROM carwash_applications WHERE status = "Approved"'
		);
		res.json(rows);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch approved carwash applications', details: error.message });
	}
};

exports.getApprovedWithAppointments = async (req, res) => {
	try {
		const [carwashes] = await pool.query(
			'SELECT applicationId, carwashName FROM carwash_applications WHERE status = "Approved"'
		);
		for (const carwash of carwashes) {
			const [appointments] = await pool.query(
				`SELECT b.appointment_id AS appointmentId, CONCAT(u.first_name, ' ', u.last_name) AS userName, u.email AS userEmail
				 FROM bookings b
				 JOIN users u ON b.user_id = u.user_id
				 WHERE b.applicationId = ? AND b.status = "Confirmed"`,
				[carwash.applicationId]
			);
			carwash.appointments = appointments;
		}
		res.json(carwashes);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch data', details: error.message });
	}
};
