const pool = require('../models/userModel');
const argon2 = require('argon2');

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Паролду шифрлөө
        const hashedPassword = await argon2.hash(password);
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, email, hashedPassword]
        );
        res.status(201).json({ message: 'Катталуу ийгиликтүү!', userId: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ message: 'Катталуу катасы', error });
    }
};


const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        
        if (!user) return res.status(404).json({ message: 'Колдонуучу табылган жок!' });

        const isValidPassword = await argon2.verify(user.password, password);
        if (!isValidPassword) return res.status(401).json({ message: 'Парол туура эмес!' });

        // JWT түзүү
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Кирүү ийгиликтүү!', token });
    } catch (error) {
        res.status(500).json({ message: 'Кирүү катасы', error });
    }
};