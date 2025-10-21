const bcrypt = require('bcryptjs');
const pool = require('../db');
const nodemailer = require('nodemailer');

async function sendWelcomeEmail(email, firstName) {
  const transporter = nodemailer.createTransport({
    service: email.includes('yahoo.') ? 'yahoo' : 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to WashConnect!',
    text: `Hello ${firstName},\n\nYour account has been created successfully!\n\nThank you for joining WashConnect.`,
  });
}

// Helper: accept only Gmail/Yahoo domains
function isAllowedEmail(email) {
  return /^[\w.-]+@(gmail\.com|yahoo\.com)$/i.test(String(email || "").trim());
}

// Normalize to YYYY-MM-DD
function toDateOnly(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : (s.includes("T") ? s.split("T")[0] : s);
}

exports.registerUser = async (req, res) => {
    const {
        first_name,
        last_name,
        email,
        password,
        phone,
        address,
        birth_date,
        gender
    } = req.body;

    try {
        // Password policy: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special, no spaces
        const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|:\";'<>?,.\/]).{8,}$/;
        if (!passwordPolicy.test(password) || /\s/.test(password)) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character, with no spaces.'
            });
        }
        // Only allow Gmail or Yahoo emails
        if (!isAllowedEmail(email)) {
            return res.status(400).json({ error: 'Only Gmail and Yahoo email addresses are allowed.' });
        }

        // Check if user already exists by email
        const checkUser = 'SELECT email FROM users WHERE email = ?';
        const [existingUser] = await pool.execute(checkUser, [email]);
        
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

    // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into DB, including gender
        const sql = `
            INSERT INTO users 
            (first_name, last_name, email, password, phone, address, birth_date, gender)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(sql, [
            first_name,
            last_name,
            email,
            hashedPassword,
            phone,
            address,
            birth_date,
            gender
        ]);

        // Send welcome email
        await sendWelcomeEmail(email, first_name);

        res.status(201).json({ 
            message: 'User registered successfully',
            userId: result.insertId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

exports.updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid user id." });
    }

    // Allowed fields
    const allowed = ["first_name", "last_name", "email", "phone", "address", "birth_date", "gender"];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        updates[k] = typeof req.body[k] === "string" ? req.body[k].trim() : req.body[k];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update." });
    }

    if (updates.birth_date !== undefined) {
      updates.birth_date = toDateOnly(updates.birth_date);
    }

    if (updates.email !== undefined) {
      if (!isAllowedEmail(updates.email)) {
        return res.status(400).json({ error: "Only Gmail and Yahoo email addresses are allowed." });
      }
      const [dupes] = await pool.execute(
        "SELECT user_id FROM users WHERE email = ? AND user_id <> ?",
        [updates.email, id]
      );
      if (dupes.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Ensure user exists by user_id
    const [exists] = await pool.execute("SELECT user_id FROM users WHERE user_id = ?", [id]);
    if (exists.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const setClauses = [];
    const params = [];
    for (const [k, v] of Object.entries(updates)) {
      setClauses.push(`${k} = ?`);
      params.push(v);
    }
    params.push(id);

    await pool.execute(`UPDATE users SET ${setClauses.join(", ")} WHERE user_id = ?`, params);

    const [rows] = await pool.execute(
      "SELECT user_id AS id, user_id, first_name, last_name, email, phone, address, birth_date, gender FROM users WHERE user_id = ?",
      [id]
    );
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
};
