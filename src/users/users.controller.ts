import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtGuard)
  @Get('profile')
  async getProfile(@Request() req: { user: { email: string } }) {
    return this.usersService.findOne(req.user.email).then((user) => {
      if (!user) return { message: 'User not found' };
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });
  }
}
