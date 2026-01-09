import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document & {
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ unique: true, sparse: true })
  phone?: string;

  // Shop Information
  @Prop({ required: true })
  shopName: string;

  @Prop()
  shopAddress?: string;

  @Prop()
  gstNumber?: string;

  @Prop()
  drugLicenseNumber?: string;

  // User Role
  @Prop({ 
    type: String, 
    enum: ['owner', 'admin', 'staff'], 
    default: 'owner' 
  })
  role: string;

  // Account Status
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  // Subscription (for future)
  @Prop({ 
    type: String, 
    enum: ['free', 'basic', 'premium'], 
    default: 'free' 
  })
  subscriptionPlan: string;

  @Prop()
  subscriptionExpiresAt?: Date;

  // Security
  @Prop()
  refreshToken?: string;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index for email lookups
UserSchema.index({ email: 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  const user = this as User & Document;

  // Only hash if password is modified
  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};
