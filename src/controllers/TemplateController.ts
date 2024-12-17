import { Request, Response } from 'express';
import Template, { ITemplate } from '../models/Template';
import fs from 'fs/promises';
import path from 'path';

interface MongoError extends Error {
    code?: number;
}

interface FileRequest extends Request {
    file?: Express.Multer.File;
}

interface SearchQuery {
    name?: RegExp;
    subject?: RegExp;
    content?: RegExp;
    type?: string;
    createdAt?: {
        $gte?: Date;
        $lte?: Date;
    };
}

export class TemplateController {
    // Create template with file upload
    public async createTemplate(req: FileRequest, res: Response): Promise<void> {
        try {
            const { name, subject, content } = req.body;

            // Zorunlu alanları kontrol et
            if (!name || !subject || !content) {
                res.status(400).json({
                    success: false,
                    error: 'Name, subject and content are required fields'
                });
                return;
            }

            const templateData = {
                name,
                subject,
                content
            };

            // Dosya yüklendiyse
            if (req.file) {
                Object.assign(templateData, {
                    attachment: {
                        filename: req.file.originalname,
                        path: req.file.path,
                        mimetype: req.file.mimetype
                    }
                });
            }

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

    // Update template with file
    public async updateTemplate(req: FileRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name, subject, content } = req.body;

            // Geçerli bir MongoDB ObjectId kontrolü
            if (!id.match(/^[0-9a-fA-F]{24}$/)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid template ID format'
                });
                return;
            }

            // Eski template'i bul
            const oldTemplate = await Template.findById(id);
            if (!oldTemplate) {
                res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
                return;
            }

            const updateData: Partial<ITemplate> = {};
            if (name) updateData.name = name;
            if (subject) updateData.subject = subject;
            if (content) updateData.content = content;

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

    // Get template names
    public async getTemplateNames(_req: Request, res: Response): Promise<void> {
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

            // Geçerli bir MongoDB ObjectId kontrolü
            if (!id.match(/^[0-9a-fA-F]{24}$/)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid template ID format'
                });
                return;
            }

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

    // Download template attachment
    public async downloadAttachment(req: Request, res: Response): Promise<void> {
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

            const template = await Template.findById(id);

            if (!template || !template.attachment) {
                res.status(404).json({
                    success: false,
                    error: 'Template or attachment not found'
                });
                return;
            }

            const filePath = path.resolve(template.attachment.path);

            // Dosyanın varlığını kontrol et
            try {
                await fs.access(filePath);
            } catch {
                res.status(404).json({
                    success: false,
                    error: 'Attachment file not found'
                });
                return;
            }

            res.download(filePath, template.attachment.filename);
        } catch (error) {
            console.error('Download attachment error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Search templates
    public async searchTemplates(req: Request, res: Response): Promise<void> {
        try {
            const {
                name,
                subject,
                content,
                startDate,
                endDate,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                page = 1,
                limit = 10
            } = req.query;

            const query: SearchQuery = {};

            // Arama kriterleri
            if (name) query.name = new RegExp(String(name), 'i');
            if (subject) query.subject = new RegExp(String(subject), 'i');
            if (content) query.content = new RegExp(String(content), 'i');

            // Tarih filtresi
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(String(startDate));
                if (endDate) query.createdAt.$lte = new Date(String(endDate));
            }

            // Sayfalama
            const skip = (Number(page) - 1) * Number(limit);

            // Sıralama
            const sort: { [key: string]: 'asc' | 'desc' } = {
                [String(sortBy)]: sortOrder === 'asc' ? 'asc' : 'desc'
            };

            // Toplam kayıt sayısı
            const total = await Template.countDocuments(query);

            // Template'leri getir
            const templates = await Template.find(query)
                .sort(sort)
                .skip(skip)
                .limit(Number(limit))
                .select('-__v');

            res.status(200).json({
                success: true,
                data: {
                    templates,
                    pagination: {
                        total,
                        page: Number(page),
                        totalPages: Math.ceil(total / Number(limit)),
                        hasMore: skip + templates.length < total
                    }
                }
            });
        } catch (error) {
            console.error('Search templates error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Get template statistics
    public async getTemplateStats(_req: Request, res: Response): Promise<void> {
        try {
            const stats = await Template.aggregate([
                {
                    $group: {
                        _id: null,
                        totalTemplates: { $sum: 1 },
                        templatesWithAttachments: {
                            $sum: { $cond: [{ $ifNull: ['$attachment', false] }, 1, 0] }
                        },
                        averageContentLength: { $avg: { $strLenCP: '$content' } }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalTemplates: 1,
                        templatesWithAttachments: 1,
                        averageContentLength: { $round: ['$averageContentLength', 0] }
                    }
                }
            ]);

            const recentActivity = await Template.find({})
                .sort({ updatedAt: -1 })
                .limit(5)
                .select('name updatedAt');

            res.status(200).json({
                success: true,
                data: {
                    stats: stats[0] || {
                        totalTemplates: 0,
                        templatesWithAttachments: 0,
                        averageContentLength: 0
                    },
                    recentActivity
                }
            });
        } catch (error) {
            console.error('Get template stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Get all templates
    public async getAllTemplates(req: Request, res: Response): Promise<void> {
        try {
            const templates = await Template.find({})
                .sort({ createdAt: -1 })
                .select('-__v');

            res.status(200).json({
                success: true,
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

    // Delete template
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

            const template = await Template.findById(id);

            if (!template) {
                res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
                return;
            }

            // Eğer dosya varsa, önce dosyayı sil
            if (template.attachment?.path) {
                try {
                    await fs.unlink(template.attachment.path);
                } catch (error) {
                    console.error('Error deleting file:', error);
                }
            }

            await Template.findByIdAndDelete(id);

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