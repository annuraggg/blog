import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubscriber extends Document {
  email: string;
  createdAt: Date;
  unsubscribed: boolean;
}

const SubscriberSchema = new Schema<ISubscriber>({
  email: { type: String, required: true, unique: true, lowercase: true },
  createdAt: { type: Date, default: Date.now },
  unsubscribed: { type: Boolean, default: false },
});

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber ?? mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);

export default Subscriber;
