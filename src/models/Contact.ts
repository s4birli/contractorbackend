import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    note?: string;
    companyName?: string;
    webSite?: string;
    type: 'agent' | 'client' | 'vendor' | 'other';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ContactSchema = new Schema<IContact>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    note: { type: String },
    companyName: { type: String },
    webSite: { type: String },
    type: {
        type: String,
        enum: ['agent', 'client', 'vendor', 'other'],
        default: 'other'
    },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

export default mongoose.model<IContact>('Contact', ContactSchema, 'Contract'); 