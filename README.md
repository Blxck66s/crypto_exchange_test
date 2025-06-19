Crypto Exchange API
This project implements a simple cryptocurrency exchange backend for the provided backend exam. It is built with **NestJS** and **Prisma** and demonstrates how to manage users, wallets, orders and transactions for both fiat and crypto currencies.

## Features

- Register and authenticate users using JWT
- Manage fiat and crypto wallets (THB, USD, BTC, ETH, etc.)
- Place buy and sell orders and trade with other users
- Transfer funds between wallets or to external crypto addresses
- Record every transaction in the database

## Requirements

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create an `.env` file** in the project root with at least the following variables:

   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/crypto_exchange"
   JWT_SECRET="your_jwt_secret"
   WALLET_ENCRYPTION_KEY="passphrase_used_to_encrypt_wallets"
   PORT=3000
   ```

3. **Run database migrations and seed data**

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. **Start the application**

   ```bash
   # development with reload
   npm run start:dev

   # or production mode
   npm run start
   ```

The API will start on `http://localhost:3000` by default. Use the generated JWT from `/auth/login` to access secured endpoints.

The initial seed creates example currencies and two sample users with wallets. See [`prisma/seed.ts`](prisma/seed.ts) for details.
