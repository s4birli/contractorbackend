import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Ana route
app.get('/api', (req: Request, res: Response) => {
    res.status(200).send({ message: 'API çalışıyor!' });
});

app.get('/', (req: Request, res: Response) => {
    res.status(200).send({ message: 'API çalışıyor!' });
});

// // MongoDB bağlantısı
// const connectDB = async () => {
//     try {
//         if (!process.env.MONGODB_URI) {
//             throw new Error('MONGODB_URI environment variable is not defined');
//         }
//         await mongoose.connect(process.env.MONGODB_URI);
//         console.log('MongoDB bağlantısı başarılı');
//     } catch (error) {
//         console.error('MongoDB bağlantı hatası:', error);
//         process.exit(1);
//     }
// };

// Sunucuyu başlat
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server ${port} portunda çalışıyor`);
});

// connectDB();

// export default app; 