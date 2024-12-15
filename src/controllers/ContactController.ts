import { Request, Response } from 'express';
import Contact, { IContact } from '../models/Contact';
import { isValidObjectId } from 'mongoose';

interface MongoError extends Error {
    code?: number;
}

export class ContactController {
    // Get all contacts
    public async getContacts(req: Request, res: Response): Promise<void> {
        try {
            const contacts = await Contact.find({ isActive: true });
            res.status(200).json({ success: true, data: contacts });
        } catch (error) {
            console.error('Get contacts error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // Get single contact
    public async getContact(req: Request, res: Response): Promise<void> {
        try {
            const contact = await Contact.findById(req.params.id);
            if (!contact) {
                res.status(404).json({ success: false, error: 'Contact not found' });
                return;
            }
            res.status(200).json({ success: true, data: contact });
        } catch (error) {
            console.error('Get contact error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // Create or update contact
    public async upsertContact(req: Request, res: Response): Promise<void> {
        try {
            const { email, ...contactData } = req.body;

            const contact = await Contact.findOneAndUpdate(
                { email },
                { ...contactData, email },
                { new: true, upsert: true, runValidators: true }
            );

            res.status(201).json({ success: true, data: contact });
        } catch (error: unknown) {
            const mongoError = error as MongoError;
            if (mongoError.code === 11000) {
                res.status(400).json({ success: false, error: 'Duplicate email address' });
                return;
            }
            console.error('Upsert contact error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // Bulk upload contacts
    public async uploadContacts(req: Request, res: Response): Promise<void> {
        try {
            const contacts = req.body;
            if (!Array.isArray(contacts)) {
                res.status(400).json({ success: false, error: 'Invalid input format' });
                return;
            }

            const result = await Contact.bulkWrite(
                contacts.map((contact) => ({
                    updateOne: {
                        filter: { email: contact.email },
                        update: { $set: contact },
                        upsert: true
                    }
                }))
            );

            res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Upload contacts error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // Export contacts
    public async exportContacts(req: Request, res: Response): Promise<void> {
        try {
            const contacts = await Contact.find({ isActive: true })
                .select('-__v')
                .lean();

            res.status(200).json({ success: true, data: contacts });
        } catch (error) {
            console.error('Export contacts error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
} 