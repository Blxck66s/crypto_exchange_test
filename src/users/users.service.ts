import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
  colors,
} from 'unique-names-generator';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(email: string, password: string) {
    const displayName = uniqueNamesGenerator({
      dictionaries: [adjectives, animals, colors],
      length: randomInt(2, 3),
      separator: '-',
    });
    const hashedPassword = await bcrypt.hash(password, 10);
    return await this.prisma.user
      .create({
        data: {
          displayName,
          email,
          password: hashedPassword,
        },
      })
      .catch((error: unknown) => {
        console.log(error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new BadRequestException('EmailAlreadyExistsException');
          }
        }
        throw new InternalServerErrorException('InternalServerErrorException');
      });
  }
}
