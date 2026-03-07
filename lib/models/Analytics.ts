import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAnalytics extends Document {
  post: mongoose.Types.ObjectId;
  date: Date;
  views: number;
  uniqueViews: number;
  likes: number;
}

const AnalyticsSchema = new Schema<IAnalytics>({
  post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  date: { type: Date, required: true },
  views: { type: Number, default: 0 },
  uniqueViews: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
});

AnalyticsSchema.index({ post: 1, date: 1 }, { unique: true });

const Analytics: Model<IAnalytics> =
  mongoose.models.Analytics ?? mongoose.model<IAnalytics>("Analytics", AnalyticsSchema);

export default Analytics;
