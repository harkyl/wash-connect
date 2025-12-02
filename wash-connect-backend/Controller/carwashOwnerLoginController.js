const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

exports.loginCarwashOwner = async (req, res) => {
    const { carwash_owner_id, ownerPassword } = req.body;

    try {
        if (!carwash_owner_id || !ownerPassword) {
            return res.status(400).json({
                error: 'Missing credentials',
                details: !carwash_owner_id ? 'Carwash Owner ID is required' : 'Password is required'
            });
        }

        const [owners] = await pool.execute(
            'SELECT owner_id, owner_email, owner_password, owner_first_name, owner_last_name, carwash_owner_id FROM carwash_owners WHERE carwash_owner_id = ?',
            [carwash_owner_id]
        );

        if (owners.length === 0) {
            return res.status(401).json({
                error: 'Login failed',
                details: 'Invalid ID or password'
            });
        }

        const owner = owners[0];

        const isPasswordValid = await bcrypt.compare(ownerPassword, owner.owner_password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Login failed',
                details: 'Invalid ID or password'
            });
        }

        const token = jwt.sign(
            {
                ownerId: owner.owner_id,
                carwashOwnerId: owner.carwash_owner_id,
                role: 'owner'
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            owner: {
                id: owner.owner_id,
                first_name: owner.owner_first_name,
                last_name: owner.owner_last_name,
                email: owner.owner_email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Server error during login',
            details: error.message
        });
    }
};
