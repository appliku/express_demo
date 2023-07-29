const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000; // Change this to the desired port number

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware to parse JSON data
app.use(express.json());

// Function to create "Messages" table if it doesn't exist
async function createTableIfNotExists() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS Messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        message TEXT NOT NULL
      )
    `;

    const client = await pool.connect();
    await client.query(createTableQuery);
    client.release();
    console.log('Table "Messages" created or already exists.');
  } catch (error) {
    console.error('Error creating table:', error);
  }
}


// Endpoint to handle POST requests
app.post('/messages', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Insert the data into the database
    const insertQuery = `
      INSERT INTO Messages (name, email, message)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [name, email, message];

    const client = await pool.connect();
    const result = await client.query(insertQuery, values);
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error storing data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server and create table before listening
(async () => {
  try {
    await createTableIfNotExists();
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error);
  }
})();
