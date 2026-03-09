import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ActivityLogService } from '../users/activity-log.service';
import { Request } from 'express';
import { 
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private activityLogService: ActivityLogService,
  ) {}

  // Register new user
  async register(registerDto: RegisterDto, request?: Request & { ip?: string; get: (header: string) => string | undefined }) {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user
    const user = new this.userModel({
      ...registerDto,
    });

    const savedUser = await user.save();

    // Log activity
    await this.activityLogService.logActivity(
      savedUser._id.toString(),
      'profile_update',
      `New user registered: ${registerDto.email}`,
      { email: registerDto.email },
      request
    );

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

    // Save refresh token
    savedUser.refreshToken = tokens.refreshToken;
    await savedUser.save();

    return {
      user: this.sanitizeUser(savedUser),
      ...tokens,
    };
  }

  // Login user
  async login(loginDto: LoginDto, request?: Request & { ip?: string; get: (header: string) => string | undefined }) {
    // Find user
    const user = await this.userModel.findOne({ email: loginDto.email });

    if (!user) {
      await this.activityLogService.logActivity(
        'anonymous',
        'login',
        `Failed login attempt for email: ${loginDto.email}`,
        { email: loginDto.email, reason: 'User not found' },
        request
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      await this.activityLogService.logActivity(
        user._id.toString(),
        'login',
        `Failed login attempt: Account deactivated for ${loginDto.email}`,
        { email: loginDto.email, reason: 'Account deactivated' },
        request
      );
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(loginDto.password);

    if (!isPasswordValid) {
      await this.activityLogService.logActivity(
        user._id.toString(),
        'login',
        `Failed login attempt: Invalid password for ${loginDto.email}`,
        { email: loginDto.email, reason: 'Invalid password' },
        request
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update refresh token and last login
    user.refreshToken = tokens.refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    // Log successful login
    await this.activityLogService.logActivity(
      user._id.toString(),
      'login',
      `Successful login for ${loginDto.email}`,
      { email: loginDto.email },
      request
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // Refresh access token
  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.userModel.findById(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify refresh token matches
    const isTokenValid = user.refreshToken === refreshToken;

    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  }

  // Logout user
  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: null,
    });

    return { message: 'Logged out successfully' };
  }

  // Get current user profile
  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password -refreshToken')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  // Update user profile
  async updateProfile(userId: string, updateData: Partial<User>) {
    // Don't allow password update through this endpoint
    delete updateData.password;
    delete updateData.refreshToken;

    const user = await this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .select('-password -refreshToken')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  // Change password
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(
      changePasswordDto.currentPassword,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update password
    user.password = changePasswordDto.newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  // Forgot password - generate reset token
  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If email exists, reset link will be sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // TODO: Send email with reset token
    // For now, return token (in production, send via email)

    return {
      message: 'Password reset link sent to email',
      resetToken, // Remove this in production
    };
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  // Helper: Generate JWT tokens
  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    
   const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '15m', // Short-lived
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d', // Long-lived
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  // Helper: Sanitize user object
  private sanitizeUser(user: UserDocument) {
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;
    delete userObj.passwordResetToken;
    delete userObj.passwordResetExpires;
    return userObj;
  }
}