import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { LocalGuard } from './guard/local.guard';
import { Public } from './decorator/public.decorator';
import { RegisterDto } from './dto';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @UseGuards(LocalGuard)
  @Post('login')
  login(@Request() req: { user: { id: string; email: string } }) {
    return this.authService.login({
      id: req.user.id,
      email: req.user.email,
    });
  }

  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto) {
    const user = await this.usersService.create(body.email, body.password);
    return this.authService.login({
      id: user.id,
      email: user.email,
    });
  }
}
