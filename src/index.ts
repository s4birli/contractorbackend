import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import contactRoutes from './routes/contactRoutes';
import templateRoutes from './routes/templateRoutes';
import aiPromptTemplateRoutes from './routes/aiPromptTemplateRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();

// CORS middleware
const allowCors = (fn: Function) => async (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    return await fn(req, res);
};

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Route'ları CORS middleware ile sarmala
app.use('/api/contacts', (req, res) => allowCors(contactRoutes)(req, res));
app.use('/api/templates', (req, res) => allowCors(templateRoutes)(req, res));
app.use('/api/ai-templates', (req, res) => allowCors(aiPromptTemplateRoutes)(req, res));
app.use('/api/users', (req, res) => allowCors(userRoutes)(req, res));

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