import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name?: string;
  companyName?: string;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  companyName: { type: String },
  role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
