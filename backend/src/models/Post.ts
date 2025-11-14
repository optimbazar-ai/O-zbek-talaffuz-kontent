import mongoose, { Schema, Document } from 'mongoose';

interface IPost extends Document {
  userId: number;
  username: string;
  content: Array<{
    script: string[];
    imageUrl: string;
    imagePrompt: string;
    hashtags: string[];
  }>;
  status: 'generated' | 'posted' | 'failed';
  instagramPostId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    userId: {
      type: Number,
      required: true,
      index: true
    },
    username: {
      type: String,
      required: true
    },
    content: [{
      script: [String],
      imageUrl: String,
      imagePrompt: String,
      hashtags: [String]
    }],
    status: {
      type: String,
      enum: ['generated', 'posted', 'failed'],
      default: 'generated'
    },
    instagramPostId: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const Post = mongoose.model<IPost>('Post', postSchema);
