import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRevision {
  title: string;
  bodyJSON: unknown;
  updatedAt: Date;
  updatedBy: mongoose.Types.ObjectId;
}

export interface IPost extends Document {
  title: string;
  subheading?: string;
  slug: string;
  slugHistory: string[];
  coverImage?: string;
  coverImageAlt?: string;
  bodyJSON: unknown;
  bodyHTML: string;
  tags: string[];
  series?: mongoose.Types.ObjectId;
  seriesOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  status: "draft" | "scheduled" | "published" | "archived" | "private" | "unlisted";
  publishDate?: Date;
  scheduledFor?: Date;
  sendNewsletter: boolean;
  kitCampaignId?: string;
  readingTime: number;
  author: mongoose.Types.ObjectId;
  revisions: IRevision[];
  viewCount: number;
  uniqueViewCount: number;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const RevisionSchema = new Schema<IRevision>({
  title: { type: String, required: true },
  bodyJSON: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    subheading: { type: String },
    slug: { type: String, required: true, unique: true },
    slugHistory: [{ type: String }],
    coverImage: { type: String },
    coverImageAlt: { type: String },
    bodyJSON: { type: mongoose.Schema.Types.Mixed, required: true },
    bodyHTML: { type: String, required: true },
    tags: [{ type: String }],
    series: { type: Schema.Types.ObjectId, ref: "Series" },
    seriesOrder: { type: Number },
    seoTitle: { type: String },
    seoDescription: { type: String },
    canonicalUrl: { type: String },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "archived", "private", "unlisted"],
      default: "draft",
    },
    publishDate: { type: Date },
    scheduledFor: { type: Date },
    sendNewsletter: { type: Boolean, default: false },
    kitCampaignId: { type: String },
    readingTime: { type: Number, default: 0 },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revisions: [RevisionSchema],
    viewCount: { type: Number, default: 0 },
    uniqueViewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Full-text search index
PostSchema.index({ title: "text", bodyHTML: "text", tags: "text" });

const Post: Model<IPost> =
  mongoose.models.Post ?? mongoose.model<IPost>("Post", PostSchema);

export default Post;
