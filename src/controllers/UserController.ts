import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';

interface FileRequest extends Request {
    file?: Express.Multer.File;
}

interface MongoError extends Error {
    code?: number;
}

export class UserController {
    // Kullanıcı kaydı
    public async register(req: FileRequest, res: Response): Promise<void> {
        try {
            const { name, email, password } = req.body;

            // Zorunlu alanları kontrol et
            if (!name || !email || !password) {
                res.status(400).json({
                    success: false,
                    error: 'Name, email and password are required fields'
                });
                return;
            }

            // Email formatını kontrol et
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid email format'
                });
                return;
            }

            const userData = {
                name,
                email,
                password
            };

            // Profil resmi yüklendiyse
            if (req.file) {
                const imageData = await fs.readFile(req.file.path);
                Object.assign(userData, {
                    profileImage: {
                        filename: req.file.originalname,
                        path: req.file.path,
                        mimetype: req.file.mimetype,
                        data: imageData
                    }
                });
                // Geçici dosyayı sil
                await fs.unlink(req.file.path);
            }

            const user = new User(userData);
            await user.save();

            // JWT token oluştur
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email
                    },
                    token
                }
            });
        } catch (error: unknown) {
            const mongoError = error as MongoError;
            if (mongoError.code === 11000) {
                res.status(400).json({
                    success: false,
                    error: 'Email already exists'
                });
                return;
            }
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Kullanıcı girişi
    public async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            // Zorunlu alanları kontrol et
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    error: 'Email and password are required'
                });
                return;
            }

            // Kullanıcıyı bul
            const user = await User.findOne({ email });
            if (!user) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
                return;
            }

            // Şifreyi kontrol et
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
                return;
            }

            // JWT token oluştur
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '48h' }
            );

            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email
                    },
                    token
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Profil resmi güncelleme
    public async updateProfileImage(req: FileRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: 'Profile image is required'
                });
                return;
            }

            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
                return;
            }

            // Eski profil resmini sil
            if (user.profileImage?.path) {
                try {
                    await fs.unlink(user.profileImage.path);
                } catch (error) {
                    console.error('Error deleting old profile image:', error);
                }
            }

            // Yeni resmi kaydet
            const imageData = await fs.readFile(req.file.path);
            user.profileImage = {
                filename: req.file.originalname,
                path: req.file.path,
                mimetype: req.file.mimetype,
                data: imageData
            };

            // Geçici dosyayı sil
            await fs.unlink(req.file.path);

            await user.save();

            res.status(200).json({
                success: true,
                message: 'Profile image updated successfully'
            });
        } catch (error) {
            console.error('Update profile image error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // Profil resmi getirme
    public async getProfileImage(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            const user = await User.findById(userId);
            if (!user || !user.profileImage) {
                res.status(404).json({
                    success: false,
                    error: 'User or profile image not found'
                });
                return;
            }

            res.set('Content-Type', user.profileImage.mimetype);
            res.send(user.profileImage.data);
        } catch (error) {
            console.error('Get profile image error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
} 