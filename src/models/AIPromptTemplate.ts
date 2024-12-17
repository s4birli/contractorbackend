import mongoose, { Document, Schema } from 'mongoose';

export interface IAIPromptTemplate extends Document {
    name: string;
    agent: string;
    prompt: string;
    attachment?: {
        filename: string;
        path: string;
        mimetype: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const AIPromptTemplateSchema = new Schema<IAIPromptTemplate>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    agent: {
        type: String,
        required: true,
        trim: true
    },
    prompt: {
        type: String,
        required: true
    },
    attachment: {
        filename: String,
        path: String,
        mimetype: String
    }
}, {
    timestamps: true
});

// İndeks oluşturma
AIPromptTemplateSchema.index({ name: 1 });
AIPromptTemplateSchema.index({ agent: 1 });

export default mongoose.model<IAIPromptTemplate>('AIPromptTemplate', AIPromptTemplateSchema, 'AIPromptTemplate'); 