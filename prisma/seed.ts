import { PrismaClient, currency_type } from '@prisma/client';
const prisma = new PrismaClient();
import * as bcrypt from 'bcrypt';
import { Wallet } from 'ethers';

async function main() {
  if (!process.env.WALLET_ENCRYPTION_KEY) {
    throw new Error('WALLET_ENCRYPTION_KEY is not set');
  }

  //currencies
  const thb = await prisma.currency.upsert({
    where: { codeName: 'THB', type: currency_type.fiat },
    update: {},
    create: {
      name: 'Thai Baht',
      codeName: 'THB',
      type: currency_type.fiat,
      decimals: 2,
    },
  });
  const usd = await prisma.currency.upsert({
    where: { codeName: 'USD', type: currency_type.fiat },
    update: {},
    create: {
      name: 'US Dollar',
      codeName: 'USD',
      type: currency_type.fiat,
      decimals: 2,
    },
  });
  const btc = await prisma.currency.upsert({
    where: { codeName: 'BTC', type: currency_type.crypto },
    update: {},
    create: {
      name: 'Bitcoin',
      codeName: 'BTC',
      type: currency_type.crypto,
      decimals: 8,
    },
  });
  const eth = await prisma.currency.upsert({
    where: { codeName: 'ETH', type: currency_type.crypto },
    update: {},
    create: {
      name: 'Ethereum',
      codeName: 'ETH',
      type: currency_type.crypto,
      decimals: 18,
    },
  });

  //users
  const orderSeller = await prisma.user.upsert({
    where: { email: 'johnSeller@example.com' },
    update: {},
    create: {
      displayName: 'johnSeller',
      email: 'johnSeller@example.com',
      password: await bcrypt.hash('123456', 10),
    },
  });

  const orderBuyer = await prisma.user.upsert({
    where: { email: 'johnBuyer@example.com' },
    update: {},
    create: {
      displayName: 'johnBuyer',
      email: 'johnBuyer@example.com',
      password: await bcrypt.hash('123456', 10),
    },
  });

  const ethWallet = Wallet.createRandom();

  //wallet
  await prisma.userWallet.createMany({
    data: [
      {
        userId: orderSeller.id,
        currencyId: eth.id,
        depositAddress: ethWallet.address,
        privateKey: await ethWallet.encrypt(process.env.WALLET_ENCRYPTION_KEY),
      },
      {
        userId: orderBuyer.id,
        currencyId: thb.id,
        balance: 1000000, // 1 ล้านบาท
      },
      {
        userId: orderBuyer.id,
        currencyId: usd.id,
        balance: 10000, // 10,000 USD
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
