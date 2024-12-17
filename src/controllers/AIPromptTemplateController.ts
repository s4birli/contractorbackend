import { Request, Response } from 'express';
import AIPromptTemplate, { IAIPromptTemplate } from '../models/AIPromptTemplate';
import fs from 'fs/promises';

interface MongoError extends Error {
    code?: number;
}

interface FileRequest extends Request {
    file?: Express.Multer.File;
}

export class AIPromptTemplateController {
    // Tüm template'leri getir
    public async getAllTemplates(_req: Request, res: Response): Promise<void> {
        try {
            const templates = await AIPromptTemplate.find({})
                .sort({ createdAt: -1 })
                .select('_id name agent prompt attachment createdAt updatedAt');

            res.status(200).json({
                success: true,
                count: templates.length,
                data: templates
            });
        } catch (error) {
            console.error('Get all templates error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Template isimleri ve ID'lerini getir
    public async getTemplateNames(_req: Request, res: Response): Promise<void> {
        try {
            const templates = await AIPromptTemplate.find({})
                .select('name agent')
                .sort({ name: 1 });

            res.status(200).json({
                success: true,
                data: templates.map(template => ({
                    id: template._id,
                    name: template.name,
                    agent: template.agent
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

    // ID'ye göre template getir
    public async getTemplateById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id.match(/^[0-9a-fA-F]{24}$/)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid template ID format'
                });
                return;
            }

            const template = await AIPromptTemplate.findById(id)
                .select('_id name agent prompt attachment createdAt updatedAt');

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

    // Yeni template oluştur
    public async createTemplate(req: FileRequest, res: Response): Promise<void> {
        try {
            console.log('Request body:', req.body);
            console.log('Request file:', req.file);

            const { name, agent, prompt } = req.body;

            if (!name || !agent || !prompt) {
                res.status(400).json({
                    success: false,
                    error: 'Name, agent and prompt are required fields'
                });
                return;
            }

            const templateData = {
                name,
                agent,
                prompt
            };

            // Dosya yüklendiyse
            if (req.file) {
                console.log('Processing uploaded file:', req.file);
                Object.assign(templateData, {
                    attachment: {
                        filename: req.file.originalname,
                        path: req.file.path,
                        mimetype: req.file.mimetype
                    }
                });
            } else {
                console.log('No file uploaded');
            }

            console.log('Template data to save:', templateData);
            const template = new AIPromptTemplate(templateData);
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

    // Template güncelle
    public async updateTemplate(req: FileRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name, agent, prompt } = req.body;

            if (!id.match(/^[0-9a-fA-F]{24}$/)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid template ID format'
                });
                return;
            }

            // Eski template'i bul
            const oldTemplate = await AIPromptTemplate.findById(id);
            if (!oldTemplate) {
                res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
                return;
            }

            const updateData: Partial<IAIPromptTemplate> = {};
            if (name) updateData.name = name;
            if (agent) updateData.agent = agent;
            if (prompt) updateData.prompt = prompt;

            // Yeni dosya yüklendiyse
            if (req.file) {
                // Eski dosyayı sil
                if (oldTemplate.attachment?.path) {
                    try {
                        await fs.unlink(oldTemplate.attachment.path);
                    } catch (error) {
                        console.error('Error deleting old file:', error);
                    }
                }

                // Yeni dosya bilgilerini ekle
                updateData.attachment = {
                    filename: req.file.originalname,
                    path: req.file.path,
                    mimetype: req.file.mimetype
                };
            }

            const template = await AIPromptTemplate.findByIdAndUpdate(
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
        } catch (error: unknown) {
            const mongoError = error as MongoError;
            if (mongoError.code === 11000) {
                res.status(400).json({
                    success: false,
                    error: 'Template name must be unique'
                });
                return;
            }
            console.error('Update template error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Template sil
    public async deleteTemplate(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id.match(/^[0-9a-fA-F]{24}$/)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid template ID format'
                });
                return;
            }

            const template = await AIPromptTemplate.findById(id);

            if (!template) {
                res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
                return;
            }

            // Eğer dosya varsa sil
            if (template.attachment?.path) {
                try {
                    await fs.unlink(template.attachment.path);
                } catch (error) {
                    console.error('Error deleting file:', error);
                }
            }

            await AIPromptTemplate.findByIdAndDelete(id);

            res.status(200).json({
                success: true,
                message: 'Template successfully deleted'
            });
        } catch (error) {
            console.error('Delete template error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
} 