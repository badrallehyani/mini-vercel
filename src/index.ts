import { config } from 'dotenv';
config();

import express, { Request, Response } from 'express';
import cors from "cors";
import databaseRouter from './routes/database.routes';

import appRouter from './routes/app.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', databaseRouter);
app.use('/', appRouter);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});