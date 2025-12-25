import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      // The user who is subscribing
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscribedToChannel: {
      // The user who is being subscribed to - one to whom the subscriber is subscribing
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
