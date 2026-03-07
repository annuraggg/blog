import mongoose, { Document, Model, Schema } from "mongoose";

export interface ILike extends Document {
  post: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  ipAddress: string;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    ipAddress: { type: String, required: true },
  },
  { timestamps: true }
);

// Prevent duplicate likes from same IP per post
LikeSchema.index({ post: 1, ipAddress: 1 }, { unique: true });

const Like: Model<ILike> =
  mongoose.models.Like ?? mongoose.model<ILike>("Like", LikeSchema);

export default Like;
