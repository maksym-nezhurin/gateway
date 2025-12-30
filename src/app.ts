import express from 'express';
import cors from 'cors';
import routes from './routes';
import { wrapDataMiddleware } from './middleware/wrapData.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { corsOptions } from './config/cors.config';

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(wrapDataMiddleware);
app.use(routes);
app.use(errorMiddleware);

export default app;
