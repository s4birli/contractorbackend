import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import contactRoutes from './routes/contactRoutes';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/contacts', contactRoutes);

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