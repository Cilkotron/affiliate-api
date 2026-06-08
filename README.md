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
- POST /api/auth/register
- POST /api/auth/login

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