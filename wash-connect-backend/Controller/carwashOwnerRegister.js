const bcrypt = require('bcryptjs');
const pool = require('../db');

exports.registerCarwashOwner = async (req, res) => {
    // Accept frontend field names
    const {
        ownerFirstName,
        ownerLastName,
        carwash_owner_id,
        ownerEmail,
        ownerPassword,
        ownerPhone,
        ownerAddress
    } = req.body;

    // Combine first and last name for owner_name
    const owner_name = [ownerFirstName, ownerLastName].filter(Boolean).join(' ').trim();
    const owner_email = ownerEmail;
    const owner_password = ownerPassword;

    if (!owner_name || !owner_email || !owner_password || !carwash_owner_id) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Allow only Gmail or Yahoo email addresses
    const allowedEmail = /^[\w.-]+@(gmail\.com|yahoo\.com)$/i.test(owner_email);
    if (!allowedEmail) {
        return res.status(400).json({ error: 'Only Gmail and Yahoo email addresses are allowed.' });
    }

    // Password policy: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special, no spaces
    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|:";'<>?,.\/]).{8,}$/;
    if (!passwordPolicy.test(owner_password) || /\s/.test(owner_password)) {
        return res.status(400).json({
            error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character, with no spaces.'
        });
    }

    try {
        // Hash the password before saving!
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
