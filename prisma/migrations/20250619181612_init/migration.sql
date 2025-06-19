-- CreateEnum
CREATE TYPE "currency_type" AS ENUM ('fiat', 'crypto');

-- CreateEnum
CREATE TYPE "order_type" AS ENUM ('buy', 'sell');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('bank_transfer', 'prompt_pay');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('open', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('deposit', 'withdraw', 'order', 'place_order', 'cancel_order', 'transfer_crypto', 'transfer_fiat');

-- CreateEnum
CREATE TYPE "transaction_status" AS ENUM ('pending', 'completed', 'failed');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code_name" VARCHAR(10) NOT NULL,
    "type" "currency_type" NOT NULL,
    "contract_address" TEXT,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_wallet" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "currency_id" UUID NOT NULL,
    "deposit_address" TEXT,
    "private_key" JSONB,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "base_currency_id" UUID NOT NULL,
    "fiat_currency_id" UUID NOT NULL,
    "order_type" "order_type" NOT NULL,
    "price" DECIMAL(36,18) NOT NULL,
    "original_amount" DECIMAL(36,18) NOT NULL,
    "remaining_amount" DECIMAL(36,18) NOT NULL,
    "min_amount_to_order" DECIMAL(36,18),
    "max_amount_to_order" DECIMAL(36,18),
    "status" "order_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" UUID NOT NULL,
    "from_user_id" UUID,
    "to_user_id" UUID,
    "to_address" TEXT,
    "order_id" UUID,
    "amount_in" DECIMAL(36,18) NOT NULL,
    "amount_out" DECIMAL(36,18) NOT NULL,
    "fee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "type" "transaction_type" NOT NULL,
    "status" "transaction_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "currency_code_name_key" ON "currency"("code_name");

-- CreateIndex
CREATE UNIQUE INDEX "currency_code_name_type_key" ON "currency"("code_name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "user_wallet_deposit_address_key" ON "user_wallet"("deposit_address");

-- CreateIndex
CREATE UNIQUE INDEX "user_wallet_user_id_currency_id_key" ON "user_wallet"("user_id", "currency_id");

-- AddForeignKey
ALTER TABLE "user_wallet" ADD CONSTRAINT "user_wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_wallet" ADD CONSTRAINT "user_wallet_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_base_currency_id_fkey" FOREIGN KEY ("base_currency_id") REFERENCES "currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_fiat_currency_id_fkey" FOREIGN KEY ("fiat_currency_id") REFERENCES "currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
