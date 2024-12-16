import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
    name: string;
    subject: string;
    content: string;
    attachment?: {
        filename: string;
        path: string;
        mimetype: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>({
    name: {
        type: String,
        required: true,
        unique: true
    },
    subject: {
        type: String,
        required: true
    },
    content: {
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
TemplateSchema.index({ name: 1 });

export default mongoose.model<ITemplate>('Template', TemplateSchema, 'Template'); 