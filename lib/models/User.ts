import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: "admin" | "author" | "editor" | "user";
  bio?: string;
  avatar?: string;
  website?: string;
  twitter?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    image: { type: String },
    role: {
      type: String,
      enum: ["admin", "author", "editor", "user"],
      default: "user",
    },
    bio: { type: String },
    avatar: { type: String },
    website: { type: String },
    twitter: { type: String },
    emailVerified: { type: Date },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
