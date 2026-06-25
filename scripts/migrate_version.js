const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const migrate = async () => {
    try {
        await pool.query(`
            ALTER TABLE programs ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
            ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
        `);
        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

migrate();