import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';

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
            console.log('Register request body:', req.body);
            console.log('Register request file:', req.file ? {
                fieldname: req.file.fieldname,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : 'No file');

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
                try {
                    Object.assign(userData, {
                        profileImage: {
                            filename: req.file.originalname,
                            mimetype: req.file.mimetype,
                            data: req.file.buffer // Binary veriyi doğrudan kullan
                        }
                    });
                } catch (error) {
                    console.error('File processing error:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Error processing profile image'
                    });
                    return;
                }
            }

            console.log('Creating new user...');
            const user = new User(userData);
            await user.save();
            console.log('User created successfully');

            // JWT token oluştur
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '48h' }
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
            console.error('Register error details:', error);
            const mongoError = error as MongoError;
            if (mongoError.code === 11000) {
                res.status(400).json({
                    success: false,
                    error: 'Email already exists'
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error : undefined
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
                        email: user.email,
                        profileImage: user.profileImage
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

            // Yeni resmi kaydet
            user.profileImage = {
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                data: req.file.buffer
            };

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