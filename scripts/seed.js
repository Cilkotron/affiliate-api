const pool = require('../src/config/db');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');


const seed = async () => {
	try {
		console.log('Deleting tables...');
		await pool.query(`
      TRUNCATE TABLE payouts, conversions, clicks, links, affiliate_programs, affiliates, programs, users RESTART IDENTITY CASCADE;
    `);

		// Users
		console.log('Creating users...');
		const passwordHash = await bcrypt.hash('password123', 10);
		const userIds = [];

		await pool.query(
			`
      INSERT INTO users (email, password, role) VALUES ($1, $2, 'admin')
    `,
			[faker.internet.email(), passwordHash],
		);

		for (let i = 0; i < 20; i++) {
			const result = await pool.query(
				`
        INSERT INTO users (email, password, role) VALUES ($1, $2, 'affiliate') RETURNING id
      `,
				[faker.internet.email(), passwordHash],
			);
			userIds.push(result.rows[0].id);
		}

		// Programs
		console.log('Creating programs...');
		const programNames = [
			'Nike Partner Program',
			'Amazon Associates',
			'Shopify Affiliate',
			'eBay Partner Network',
			'Booking.com Affiliate',
			'Airbnb Ambassador',
			'Apple Services',
			'Samsung Affiliate',
			'Adidas Creator Club',
			'Zalando Partner',
		];
		const programIds = [];

		for (const name of programNames) {
			const result = await pool.query(
				`
        INSERT INTO programs (name, description, commission_rate, status) 
        VALUES ($1, $2, $3, $4) RETURNING id
      `,
				[
					name,
					faker.commerce.productDescription(),
					faker.number.float({ min: 3, max: 20, fractionDigits: 2 }),
					faker.helpers.arrayElement([
						'active',
						'active',
						'active',
						'inactive',
					]),
				],
			);
			programIds.push(result.rows[0].id);
		}

		// Affiliates
		console.log('Creating affiliates...');
		const affiliateIds = [];

		for (const userId of userIds) {
			const result = await pool.query(
				`
        INSERT INTO affiliates (user_id, first_name, last_name, website, status)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `,
				[
					userId,
					faker.person.firstName(),
					faker.person.lastName(),
					faker.internet.url(),
					faker.helpers.arrayElement([
						'approved',
						'approved',
						'approved',
						'pending',
						'rejected',
					]),
				],
			);
			affiliateIds.push(result.rows[0].id);
		}

		// Affiliate Programs
		console.log('Creating affiliate_programs...');
		const affiliateProgramPairs = new Set();

		for (const affiliateId of affiliateIds) {
			const count = faker.number.int({ min: 1, max: 4 });
			const shuffled = faker.helpers.shuffle([...programIds]);

			for (let i = 0; i < count; i++) {
				const programId = shuffled[i];
				const key = `${affiliateId}-${programId}`;
				if (!affiliateProgramPairs.has(key)) {
					affiliateProgramPairs.add(key);
					await pool.query(
						`
            INSERT INTO affiliate_programs (affiliate_id, program_id) VALUES ($1, $2)
          `,
						[affiliateId, programId],
					);
				}
			}
		}

		// Links
		console.log('Creating links...');
		const linkIds = [];
		const slugSet = new Set();

		for (const affiliateId of affiliateIds) {
			const count = faker.number.int({ min: 2, max: 5 });
			for (let i = 0; i < count; i++) {
				let slug;
				do {
					slug = faker.lorem.slug(3);
				} while (slugSet.has(slug));
				slugSet.add(slug);

				const programId = faker.helpers.arrayElement(programIds);
				const result = await pool.query(
					`
          INSERT INTO links (affiliate_id, program_id, slug, original_url)
          VALUES ($1, $2, $3, $4) RETURNING id
        `,
					[affiliateId, programId, slug, faker.internet.url()],
				);
				linkIds.push(result.rows[0].id);
			}
		}

		// Clicks
		console.log('Creating clicks...');
		const clickIds = [];

		for (let i = 0; i < 500; i++) {
			const linkId = faker.helpers.arrayElement(linkIds);
			const result = await pool.query(
				`
        INSERT INTO clicks (link_id, ip_address, user_agent, clicked_at)
        VALUES ($1, $2, $3, $4) RETURNING id
      `,
				[
					linkId,
					faker.internet.ip(),
					faker.internet.userAgent(),
					faker.date.between({ from: '2024-01-01', to: new Date() }),
				],
			);
			clickIds.push(result.rows[0].id);
		}

		// Conversions
		console.log('Creating conversions...');
		const shuffledClicks = faker.helpers.shuffle([...clickIds]);

		for (let i = 0; i < 150; i++) {
			const clickId = shuffledClicks[i];
			const linkId = faker.helpers.arrayElement(linkIds);
			const amount = faker.number.float({
				min: 20,
				max: 500,
				fractionDigits: 2,
			});
			const commission = parseFloat((amount * 0.1).toFixed(2));

			await pool.query(
				`
        INSERT INTO conversions (click_id, link_id, amount, commission, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
				[
					clickId,
					linkId,
					amount,
					commission,
					faker.helpers.arrayElement(['pending', 'approved', 'paid']),
					faker.date.between({ from: '2024-01-01', to: new Date() }),
				],
			);
		}

		// Payouts
		console.log('Creating payouts...');
		for (const affiliateId of affiliateIds) {
			const count = faker.number.int({ min: 1, max: 3 });
			for (let i = 0; i < count; i++) {
				const status = faker.helpers.arrayElement(['pending', 'paid']);
				await pool.query(
					`
          INSERT INTO payouts (affiliate_id, amount, status, paid_at)
          VALUES ($1, $2, $3, $4)
        `,
					[
						affiliateId,
						faker.number.float({ min: 50, max: 1000, fractionDigits: 2 }),
						status,
						status === 'paid'
							? faker.date.between({ from: '2024-01-01', to: new Date() })
							: null,
					],
				);
			}
		}

		console.log('Seed success!');
		process.exit(0);
	} catch (err) {
		console.error('Error seeding the data:', err);
		process.exit(1);
	}
};

seed();
