import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeedback {
  name?: string;
  email: string;
  phoneModel?: string;
  rating: number; // 1–5
  partsTried: string[];
  bug?: string;
  confusing?: string;
  liked?: string;
  improve?: string;
  nps?: number; // 0–10
}

export interface IFeedbackDocument extends IFeedback, Document {}

const FeedbackSchema = new Schema<IFeedbackDocument>(
  {
    name: { type: String, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 255, index: true },
    phoneModel: { type: String, trim: true, maxlength: 160 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    partsTried: { type: [String], default: [] },
    bug: { type: String, trim: true, maxlength: 4000 },
    confusing: { type: String, trim: true, maxlength: 4000 },
    liked: { type: String, trim: true, maxlength: 4000 },
    improve: { type: String, trim: true, maxlength: 4000 },
    nps: { type: Number, min: 0, max: 10 },
  },
  { timestamps: true },
);

FeedbackSchema.index({ createdAt: -1 });

const Feedback: Model<IFeedbackDocument> =
  mongoose.models.Feedback || mongoose.model<IFeedbackDocument>("Feedback", FeedbackSchema);

export default Feedback;
