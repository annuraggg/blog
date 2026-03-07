import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISeries extends Document {
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SeriesSchema = new Schema<ISeries>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    coverImage: { type: String },
  },
  { timestamps: true }
);

const Series: Model<ISeries> =
  mongoose.models.Series ?? mongoose.model<ISeries>("Series", SeriesSchema);

export default Series;
