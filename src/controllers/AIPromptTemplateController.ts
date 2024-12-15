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
    // Template listesi
    public async listTemplates(req: Request, res: Response): Promise<void> {
        try {
            const templates = await AIPromptTemplate.find({})
                .sort({ name: 1 });

            res.status(200).json({
                success: true,
                data: templates
            });
        } catch (error) {
            console.error('List templates error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Template oluştur veya güncelle (JSON)
    public async upsertTemplate(req: Request, res: Response): Promise<void> {
        try {
            const { name, agent, prompt, attachFile, attachEmail } = req.body;

            // Zorunlu alanları kontrol et
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
                prompt,
                attachFile: Boolean(attachFile),
                attachEmail: Boolean(attachEmail)
            };

            // Varsa güncelle, yoksa oluştur
            const template = await AIPromptTemplate.findOneAndUpdate(
                { name },
                templateData,
                {
                    new: true,
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true
                }
            );

            res.status(200).json({
                success: true,
                data: template
            });
        } catch (error) {
            console.error('Upsert template error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Template oluştur veya güncelle (Dosya ile)
    public async upsertTemplateWithFile(req: FileRequest, res: Response): Promise<void> {
        try {
            const { name, agent, prompt, attachFile, attachEmail } = req.body;

            // Zorunlu alanları kontrol et
            if (!name || !agent || !prompt) {
                res.status(400).json({
                    success: false,
                    error: 'Name, agent and prompt are required fields'
                });
                return;
            }

            // Önce mevcut template'i kontrol et
            const existingTemplate = await AIPromptTemplate.findOne({ name });

            // Eğer dosya varsa ve eski template'de de dosya varsa, eski dosyayı sil
            if (req.file && existingTemplate?.file?.path) {
                try {
                    await fs.unlink(existingTemplate.file.path);
                } catch (error) {
                    console.error('Error deleting old file:', error);
                }
            }

            const templateData = {
                name,
                agent,
                prompt,
                attachFile: Boolean(attachFile),
                attachEmail: Boolean(attachEmail)
            };

            // Yeni dosya yüklendiyse ekle
            if (req.file) {
                Object.assign(templateData, {
                    file: {
                        filename: req.file.originalname,
                        path: req.file.path,
                        mimetype: req.file.mimetype
                    }
                });
            }

            // Varsa güncelle, yoksa oluştur
            const template = await AIPromptTemplate.findOneAndUpdate(
                { name },
                templateData,
                {
                    new: true,
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true
                }
            );

            res.status(200).json({
                success: true,
                data: template
            });
        } catch (error) {
            console.error('Upsert template with file error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Template isimleri listesi
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

    // Template sil
    public async deleteTemplate(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Geçerli bir MongoDB ObjectId kontrolü
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
            if (template.file?.path) {
                try {
                    await fs.unlink(template.file.path);
                } catch (error) {
                    console.error('Error deleting file:', error);
                }
            }

            await template.deleteOne();

            res.status(200).json({
                success: true,
                message: 'Template deleted successfully'
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