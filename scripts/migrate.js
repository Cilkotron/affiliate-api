const pool = require('../src/config/db');


const migrate = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'affiliate' CHECK (role IN ('admin', 'affiliate')),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS programs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        commission_rate DECIMAL(5,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS affiliates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        website VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS affiliate_programs (
        id SERIAL PRIMARY KEY,
        affiliate_id INTEGER REFERENCES affiliates(id) ON DELETE CASCADE,
        program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(affiliate_id, program_id)
      );

      CREATE TABLE IF NOT EXISTS links (
        id SERIAL PRIMARY KEY,
        affiliate_id INTEGER REFERENCES affiliates(id) ON DELETE CASCADE,
        program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
        slug VARCHAR(100) UNIQUE NOT NULL,
        original_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS clicks (
        id SERIAL PRIMARY KEY,
        link_id INTEGER REFERENCES links(id) ON DELETE CASCADE,
        ip_address VARCHAR(50),
        user_agent TEXT,
        clicked_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversions (
        id SERIAL PRIMARY KEY,
        click_id INTEGER REFERENCES clicks(id) ON DELETE SET NULL,
        link_id INTEGER REFERENCES links(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        commission DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payouts (
        id SERIAL PRIMARY KEY,
        affiliate_id INTEGER REFERENCES affiliates(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
        paid_at TIMESTAMP
      );

        -- Single index
        CREATE INDEX IF NOT EXISTS idx_links_affiliate_id ON links(affiliate_id);
        CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
        CREATE INDEX IF NOT EXISTS idx_conversions_link_id ON conversions(link_id);
        CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
        CREATE INDEX IF NOT EXISTS idx_affiliate_programs_affiliate_id ON affiliate_programs(affiliate_id);

        -- Composite index
        CREATE INDEX IF NOT EXISTS idx_affiliate_programs_composite ON affiliate_programs(affiliate_id, program_id);
        CREATE INDEX IF NOT EXISTS idx_links_composite ON links(affiliate_id, program_id);
        CREATE INDEX IF NOT EXISTS idx_conversions_status_date ON conversions(status, created_at);
        CREATE INDEX IF NOT EXISTS idx_clicks_link_date ON clicks(link_id, clicked_at);
    `);

    console.log('Migration success!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(1);
  }
};

migrate();