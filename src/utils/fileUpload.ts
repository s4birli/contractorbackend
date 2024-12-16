import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// uploads klasörünü oluştur
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Dosya yükleme için depolama ayarları
const storage = multer.memoryStorage(); // Binary veri için memory storage kullan

// Dosya filtreleme
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // İzin verilen resim dosyası türleri
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, JPEG, PNG, GIF and WebP images are allowed.'));
    }
};

// Multer yapılandırması
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

export default upload; 