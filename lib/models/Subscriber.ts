import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubscriber extends Document {
  email: string;
  createdAt: Date;
  unsubscribed: boolean;
  emailsSent: number;
  lastEmailSentAt?: Date;
}

const SubscriberSchema = new Schema<ISubscriber>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  unsubscribed: { type: Boolean, default: false },
  emailsSent: { type: Number, default: 0 },
  lastEmailSentAt: { type: Date },
});

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber ?? mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);

export default Subscriber;
