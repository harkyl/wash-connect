const pool = require('../db');

exports.uploadUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const userId = req.params.id;

    try {
      // Use user_id which is the canonical primary key in this schema
      await pool.query(
        'UPDATE users SET avatar = ? WHERE user_id = ?',
        [avatarPath, userId]
      );
    } catch (e) {
      // If avatar column doesn't exist, attempt to create it and retry once
      const msg = String(e && e.message || '');
      const code = e && e.code;
      if (code === 'ER_BAD_FIELD_ERROR' || msg.includes("Unknown column 'avatar'")) {
        try {
          await pool.query('ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL');
          await pool.query('UPDATE users SET avatar = ? WHERE user_id = ?', [avatarPath, userId]);
        } catch (e2) {
          console.warn('Avatar column add/update skipped:', e2.message);
        }
      } else {
        console.warn('Could not persist user avatar to DB:', msg);
      }
    }

    res.json({ avatar: avatarPath });
  } catch (err) {
    console.error('User avatar upload error:', err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};
