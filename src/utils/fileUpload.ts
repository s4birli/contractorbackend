import multer from 'multer';
import path from 'path';
import { Request } from 'express';

interface MulterCallback {
    (error: Error | null, destination: string): void;
}

interface FileNameCallback {
    (error: Error | null, filename: string): void;
}

// Dosya yükleme için depolama ayarları
const storage = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb: MulterCallback) => {
        cb(null, 'uploads/');
    },
    filename: (_req: Request, file: Express.Multer.File, cb: FileNameCallback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

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