import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('/signin')
    signIn(@Body() authCresentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
        return this.authService.signIn(authCresentialsDto);
    }

    @Post('/signup')
    signUp(@Body() authCresentialsDto: AuthCredentialsDto): Promise<void> {
        return this.authService.createUser(authCresentialsDto);
    }
}
