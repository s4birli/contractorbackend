import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import contactRoutes from './routes/contactRoutes';
import templateRoutes from './routes/templateRoutes';
import aiPromptTemplateRoutes from './routes/aiPromptTemplateRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();

// CORS ayarları
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400 // 24 saat
}));

// OPTIONS isteklerini işle
app.options('*', cors());

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/contacts', contactRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/ai-templates', aiPromptTemplateRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req: Request, res: Response) => {
    res.status(200).send({ message: 'API çalışıyor!' });
});

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB bağlantısı başarılı');
    } catch (error) {
        console.error('MongoDB bağlantı hatası:', error);
        process.exit(1);
    }
};

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server ${port} portunda çalışıyor`);
});

connectDB();

export default app; 