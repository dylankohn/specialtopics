// Required modules and configuration
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
require('dotenv').config();
const bodyParser = require('body-parser');


const app = express();
const PORT = process.env.PORT || 3000;

// Database connection pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Parse JSON bodies
app.use(bodyParser.json()); // Parse JSON requests

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the database
        const query = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
        db.query(query, [username, passwordHash], (err, results) => {
            if (err) {
                console.error('Error registering user:', err);
                return res.status(500).json({ error: 'Failed to register user' });
            }

            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (err) {
        console.error('Error hashing password:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const util = require('util');

db.query = util.promisify(db.query);

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        console.log('Missing username or password');
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const query = 'SELECT * FROM users WHERE username = ?';
        db.query(query, [username], async (err, results) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                console.log('No user found with username:', username);
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const user = results[0];
            console.log(`Stored hashed password for ${username}:`, user.password_hash);

            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            console.log('Password match result:', passwordMatch);

            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const token = jwt.sign({ users_id: user.users_id }, process.env.JWT_SECRET, {
                expiresIn: '1h',
            });

            console.log('Login successful, token generated:', token);
            res.json({ success: true, token });
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user; // Attach the user payload to the request
        next();
    });
}

// Example of a protected route
app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Access granted', user: req.user });
});

app.get('/api/jobs', authenticateToken, (req, res) => {
    const userId = req.user.users_id; // Extract `users_id` from the token payload

    const query = `
        SELECT 
            job.job_id,
            job.job_name, 
            job.job_start, 
            job.job_end,
            customer.customer_fname,
            customer.customer_lname,
            material.material_type,
            material.material_amount,
            material.material_date,
            material_list.material_list_id,
            material_list.material_list_item,
            material_list.material_list_amount,
            quote.quote_id,
            quote.part_name,
            quote.part_price
        FROM job
        LEFT JOIN customer ON job.customer_id = customer.customer_id
        LEFT JOIN material ON job.job_id = material.job_id
        LEFT JOIN material_list ON material_list.job_id = job.job_id
        LEFT JOIN quote ON quote.job_id = job.job_id
        WHERE job.users_id = ?;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching jobs:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(results); // Send filtered jobs to the client
    });
});

// Get all customers
app.get('/api/customers', (req, res) => {
    db.query('SELECT * FROM customer', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json(results);
    });
});

// Add a new job to the database
app.post('/api/jobs', authenticateToken, (req, res) => {
    const { job_name, job_start, job_end, customer_id } = req.body;

    if (!job_name || !customer_id) {
        return res.status(400).json({ error: 'Job name and customer ID are required' });
    }

    const jobStart = job_start || null;
    const jobEnd = job_end || null;
    const userId = req.user.users_id; // Extract `users_id` from the token

    const jobQuery = `
        INSERT INTO job (job_name, job_start, job_end, customer_id, users_id) 
        VALUES (?, ?, ?, ?, ?)
    `;
    const jobValues = [job_name, jobStart, jobEnd, customer_id, userId];

    db.query(jobQuery, jobValues, (err, jobResult) => {
        if (err) {
            console.error('Error inserting job:', err);
            return res.status(500).json({ error: 'Failed to add job' });
        }

        const jobId = jobResult.insertId;

        res.json({ success: true, job_id: jobId, job_name, job_start, job_end, customer_id });
    });
});

// Add material to the database
app.post('/api/addMaterial', (req, res) => {
    const { material_name, material_amount, job_id } = req.body;

    if (!material_name || !material_amount) {
        return res.status(400).json({ error: 'Material name and amount are required' });
    }

    const materialQuery = `
        INSERT INTO material (material_type, material_amount, material_date, job_id)
        VALUES (?, ?, NOW(), ?)
    `;
    const materialValues = [material_name, material_amount, job_id];
    db.query(materialQuery, materialValues, (err, materialResult) => {
        if (err) {
            console.error('Error inserting material:', err);
            return res.status(500).json({ error: 'Failed to add material' });
        }

        res.json({ success: true, material_id: material_name, material_amount, job_id });

    });
});

// Delete a material from the database
app.delete('/api/deletematerial', (req, res) => {
    const { material_type } = req.body;

    if (!material_type) {
        return res.status(400).json({ error: 'Material name is required' });
    }

    // Query to check if the material exists
    const findMaterialQuery = `SELECT * FROM material WHERE material_type = ?`;
    db.query(findMaterialQuery, [material_type], (err, results) => {
        if (err) {
            console.error('Error finding material:', err);
            return res.status(500).json({ error: 'Failed to find material' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Material not found' });
        }

        const materialId = results[0].material_id;
        // Delete the material from the database
        const deleteMaterialQuery = `DELETE FROM material WHERE material_id = ?`;
        db.query(deleteMaterialQuery, [materialId], (err) => {
            if (err) {
                console.error('Error deleting material:', err);
                return res.status(500).json({ error: 'Failed to delete material' });
            }
            res.json({ success: true, message: 'Material deleted successfully' });
        });
    });
});

app.delete('/api/deletemateriallistitem', (req, res) => {
    const { material_list_item } = req.body;

    if (!material_list_item) {
        return res.status(400).json({ error: 'Material name is required' });
    }

    // Query to check if the material exists
    const findMaterialQuery = `SELECT * FROM material_list WHERE material_list_item = ?`;
    db.query(findMaterialQuery, [material_list_item], (err, results) => {
        if (err) {
            console.error('Error finding material:', err);
            return res.status(500).json({ error: 'Failed to find material' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Material not found' });
        }

        const materialListId = results[0].material_list_id;
        // Delete the material from the database
        const deleteMaterialListQuery = `DELETE FROM material_list WHERE material_list_id = ?`;
        db.query(deleteMaterialListQuery, [materialListId], (err) => {
            if (err) {
                console.error('Error deleting material:', err);
                return res.status(500).json({ error: 'Failed to delete material' });
            }
            res.json({ success: true, message: 'Material deleted successfully' });
        });
    });
});

// delete quote item
app.delete('/api/deletequoteitem', (req, res) => {
    const { part_name } = req.body;

    if (!part_name) {
        return res.status(400).json({ error: 'Item name is required' });
    }

    // Query to check if the material exists
    const findQuoteQuery = `SELECT * FROM quote WHERE part_name = ?`;
    db.query(findQuoteQuery, [part_name], (err, results) => {
        if (err) {
            console.error('Error finding item:', err);
            return res.status(500).json({ error: 'Failed to find item' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const quoteId = results[0].quote_id;
        // Delete the material from the database
        const deleteQuoteItemQuery = `DELETE FROM quote WHERE quote_id = ?`;
        db.query(deleteQuoteItemQuery, [quoteId], (err) => {
            if (err) {
                console.error('Error deleting item:', err);
                return res.status(500).json({ error: 'Failed to delete item' });
            }
            res.json({ success: true, message: 'Item deleted successfully' });
        });
    });
});

app.delete('/api/deletejob', authenticateToken, (req, res) => {
    const { job_name } = req.body;

    if (!job_name) {
        return res.status(400).json({ error: 'Job name is required' });
    }

    const userId = req.user.users_id; // Extract `users_id` from the token
    console.log(`Deleting job for user ID: ${userId} with job name: ${job_name}`);

    // Query to delete the job with the given name and user ID
    const deleteJobQuery = `
        DELETE FROM job 
        WHERE job_name = ? AND users_id = ?
    `;

    db.query(deleteJobQuery, [job_name, userId], (err, result) => {
        if (err) {
            console.error('Error deleting job:', err);
            return res.status(500).json({ error: 'Database error while deleting job' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Job not found or unauthorized to delete' });
        }

        console.log(`Job '${job_name}' deleted successfully for user ID: ${userId}`);
        res.json({ success: true, message: 'Job deleted successfully' });
    });
});



app.post('/api/materials', (req, res) => {
    const { material_type, material_amount, job_id, material_date } = req.body;

    if (!material_type || !material_amount || !job_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
        INSERT INTO material (material_type, material_amount, job_id, material_date)
        VALUES (?, ?, ?, ?)
    `;
    const values = [material_type, material_amount, job_id, material_date];

    db.query(query, values, (error, results) => {
        if (error) {
            console.error('Error inserting material:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({ message: 'Material added successfully', materialId: results.insertId });
    });
});

app.post('/api/materialList', (req, res) => {
    const { material_list_item, material_list_amount, job_id } = req.body;

    if (!material_list_item || !material_list_amount || !job_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
        INSERT INTO material_list (material_list_item, material_list_amount, job_id)
        VALUES (?, ?, ?)
    `;
    const values = [material_list_item, material_list_amount, job_id];

    db.query(query, values, (error, results) => {
        if (error) {
            console.error('Error inserting material:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({ message: 'Material added successfully', materialListId: results.insertId });
    });
});

app.post('/api/quote', (req, res) => {
    const { part_name, part_price, job_id } = req.body;

    if (!part_name || !part_price || !job_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
        INSERT INTO quote (part_name, part_price, job_id)
        VALUES (?, ?, ?)
    `;
    const values = [part_name, part_price, job_id];

    db.query(query, values, (error, results) => {
        if (error) {
            console.error('Error inserting quote item:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({ message: 'Quote item added successfully', quoteId: results.insertId });
    });
});

// Route to get the total price of all parts or for a specific job
app.get('/api/totalPartPrice', (req, res) => {
    const { job_id } = req.query; // Accept an optional job_id as a query parameter

    // Modify query based on whether job_id is provided
    const query = job_id 
        ? `SELECT SUM(part_price) AS totalPrice FROM quote WHERE job_id = ?`
        : `SELECT SUM(part_price) AS totalPrice FROM quote`;

    const values = job_id ? [job_id] : [];

    db.query(query, values, (error, results) => {
        if (error) {
            console.error('Error fetching total part price:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        const totalPrice = results[0]?.totalPrice || 0; // If no rows, return 0
        res.json({ totalPrice });
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
