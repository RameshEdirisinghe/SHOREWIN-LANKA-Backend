const bcrypt = require('bcryptjs');
const Admin  = require('../models/admin.model');

/**
 * POST /api/auth/login
 * Verifies admin credentials against the MongoDB admin record.
 * Never returns the password hash to the client.
 */
async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });

    if (!admin) {
      // Use same error message to avoid username enumeration
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Return minimal success payload — no token needed for this simple admin use-case
    return res.json({ success: true, message: 'Authenticated successfully.' });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { login };
