import { Request, Response } from 'express';
import Template, { ITemplate } from '../models/Template';

interface MongoError extends Error {
    code?: number;
}

export class TemplateController {
    // Create template
    public async createTemplate(req: Request, res: Response): Promise<void> {
        try {
            const templateData = req.body;
            const template = new Template(templateData);
            await template.save();

            res.status(201).json({
                success: true,
                data: template
            });
        } catch (error: unknown) {
            const mongoError = error as MongoError;
            if (mongoError.code === 11000) {
                res.status(400).json({
                    success: false,
                    error: 'Template with this name already exists'
                });
                return;
            }
            console.error('Create template error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Update template
    public async updateTemplate(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const template = await Template.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!template) {
                res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: template
            });
        } catch (error) {
            console.error('Update template error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Get template names
    public async getTemplateNames(req: Request, res: Response): Promise<void> {
        try {
            const templates = await Template.find({})
                .select('name')
                .sort({ name: 1 });

            res.status(200).json({
                success: true,
                data: templates.map(template => ({
                    id: template._id,
                    name: template.name
                }))
            });
        } catch (error) {
            console.error('Get template names error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Get template by id
    public async getTemplateById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const template = await Template.findById(id);

            if (!template) {
                res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: template
            });
        } catch (error) {
            console.error('Get template by id error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
} 