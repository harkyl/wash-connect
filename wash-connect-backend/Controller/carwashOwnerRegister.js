const bcrypt = require('bcryptjs');
const pool = require('../db');

// Check if Owner ID is available
exports.checkOwnerId = async (req, res) => {
    const { id } = req.params;

    // Validate format
    if (!id || !/^\d{5}$/.test(id)) {
        return res.status(400).json({ error: 'Invalid Owner ID format', available: false });
    }

    try {
        const [rows] = await pool.query(
            'SELECT carwash_owner_id FROM carwash_owners WHERE carwash_owner_id = ?',
            [id]
        );

        res.json({
            available: rows.length === 0,
            message: rows.length === 0 ? 'Owner ID is available' : 'Owner ID is already taken'
        });
    } catch (error) {
        console.error('Error checking owner ID:', error);
        res.status(500).json({ error: 'Server error', available: false });
    }
};

// Check if Email is available
exports.checkEmail = async (req, res) => {
    const email = decodeURIComponent(req.params.email).toLowerCase().trim();

    // Validate format
    if (!email || !/^[\w.-]+@(gmail\.com|yahoo\.com)$/i.test(email)) {
        return res.status(400).json({ error: 'Invalid email format', available: false });
    }

    try {
        const [rows] = await pool.query(
            'SELECT owner_email FROM carwash_owners WHERE LOWER(owner_email) = ?',
            [email]
        );

        res.json({
            available: rows.length === 0,
            message: rows.length === 0 ? 'Email is available' : 'Email is already registered'
        });
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ error: 'Server error', available: false });
    }
};

exports.registerCarwashOwner = async (req, res) => {
    const {
        ownerFirstName,
        ownerLastName,
        carwash_owner_id,
        ownerEmail,
        ownerPassword,
        ownerPhone,
        ownerAddress
    } = req.body;

    const owner_name = [ownerFirstName, ownerLastName].filter(Boolean).join(' ').trim();
    const owner_email = ownerEmail;
    const owner_password = ownerPassword;

    if (!owner_name || !owner_email || !owner_password || !carwash_owner_id) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const allowedEmail = /^[\w.-]+@(gmail\.com|yahoo\.com)$/i.test(owner_email);
    if (!allowedEmail) {
        return res.status(400).json({ error: 'Only Gmail and Yahoo email addresses are allowed.' });
    }

    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|:";'<>?,.\/]).{8,}$/;
    if (!passwordPolicy.test(owner_password) || /\s/.test(owner_password)) {
        return res.status(400).json({
            error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character, with no spaces.'
        });
    }

    try {
        // Check if owner ID already exists
        const [existingId] = await pool.query(
            'SELECT carwash_owner_id FROM carwash_owners WHERE carwash_owner_id = ?',
            [carwash_owner_id]
        );
        if (existingId.length > 0) {
            return res.status(400).json({ error: 'Owner ID is already taken' });
        }

        // Check if email already exists
        const [existingEmail] = await pool.query(
            'SELECT owner_email FROM carwash_owners WHERE LOWER(owner_email) = ?',
            [owner_email.toLowerCase()]
        );
        if (existingEmail.length > 0) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        const hashedPassword = await bcrypt.hash(owner_password, 10);

        const [result] = await pool.query(
            `INSERT INTO carwash_owners (owner_first_name, owner_last_name, carwash_owner_id, owner_email, owner_password, owner_phone, owner_address)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [ownerFirstName, ownerLastName, carwash_owner_id, owner_email, hashedPassword, ownerPhone || null, ownerAddress || null]
        );

        res.status(201).json({
            success: true,
            message: "Carwash owner registered successfully",
            owner_id: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Registration failed", details: error.message });
    }
};
