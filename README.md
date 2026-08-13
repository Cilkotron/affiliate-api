# Affiliate Marketing API

REST API for tracking affiliate marketing programs, links, clicks, and conversions.

## Tech Stack

- Node.js + Express
- PostgreSQL (Supabase)
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js >= 18
- Supabase account

### Installation

1. Clone the repo
   git clone https://github.com/your-username/affiliate-api.git
   cd affiliate-api

2. Install dependencies
   npm install

3. Set up environment variables
   cp .env.example .env
   # Fill in your Supabase credentials and JWT secret

4. Run migrations
   npm run migrate

5. Seed the database
   npm run seed

6. Start the server
   npm run dev

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/register | Public | Register new user |
| POST | /api/auth/login | Public | Login and get JWT token |

### Affiliates
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/affiliates | Admin | Get all affiliates |
| GET | /api/affiliates/:id | Admin | Get affiliate by ID |
| POST | /api/affiliates | Authenticated | Create affiliate profile |
| PUT | /api/affiliates/:id | Admin | Update affiliate status |
| DELETE | /api/affiliates/:id | Admin | Delete affiliate |

### Programs
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/programs | Authenticated | Get all programs |
| GET | /api/programs/:id | Authenticated | Get program by ID |
| POST | /api/programs | Admin | Create program |
| PUT | /api/programs/:id | Admin | Update program |
| DELETE | /api/programs/:id | Admin | Delete program |

### Affiliate Programs
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/affiliate-programs | Authenticated | Get my programs |
| GET | /api/affiliate-programs/all | Admin | Get all affiliate programs |
| POST | /api/affiliate-programs/join/:program_id | Authenticated | Join a program |
| DELETE | /api/affiliate-programs/leave/:program_id | Authenticated | Leave a program |

### Links
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/links | Admin | Get all links |
| GET | /api/links/affiliate | Authenticated | Get my links |
| POST | /api/links | Authenticated | Create tracking link |
| DELETE | /api/links/:id | Admin | Delete any link |
| DELETE | /api/links/affiliate/:id | Authenticated | Delete own link |

### Clicks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/clicks | Admin | Get all clicks (paginated) |
| GET | /api/clicks/affiliate | Authenticated | Get my clicks (paginated) |
| GET | /api/clicks/go/:slug | Public | Track click and redirect |

### Conversions
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/conversions | Admin | Get all conversions (paginated) |
| GET | /api/conversions/affiliate | Authenticated | Get my conversions (paginated) |
| POST | /api/conversions | Public | Create conversion |
| PUT | /api/conversions/:id/status | Admin | Update conversion status |

### Payouts
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/payouts | Admin | Get all payouts (paginated) |
| GET | /api/payouts/affiliate | Authenticated | Get my payouts (paginated) |
| POST | /api/payouts | Authenticated | Request payout |
| PUT | /api/payouts/:id/status | Admin | Mark payout as paid |

## Swagger documentation 

/api-docs

## Running Tests
npm test

## Environment Variables

| Variable     | Description                  |
|--------------|------------------------------|
| PORT         | Server port (default 3000)   |
| DB_HOST      | Supabase database host       |
| DB_PORT      | Database port                |
| DB_NAME      | Database name                |
| DB_USER      | Database user                |
| DB_PASSWORD  | Database password            |
| JWT_SECRET   | Secret key for JWT tokens    |