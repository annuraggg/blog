import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubscriber extends Document {
  email: string;
  name?: string;
  confirmedAt?: Date;
  kitSubscriberId?: string;
  createdAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String },
    confirmedAt: { type: Date },
    kitSubscriberId: { type: String },
  },
  { timestamps: true }
);

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber ?? mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);

export default Subscriber;
