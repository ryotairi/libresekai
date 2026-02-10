import express from 'express';
import { config } from './config';
import GETApiSystem from './routes/GetSystem';
import RegisterUserRoute from './routes/RegisterUserRoute';
import { decrypt } from './utils/crypt';

const api = express();

api.use((req, res, next) => {
    if (req.headers['content-type'] === 'apilication/octet-stream') {
        const buffer = req.body as Buffer;
        const decryptedMsgPack = decrypt(buffer);
        req.body = decryptedMsgPack;
    }
});

api.get('/api/system', GETApiSystem);
api.post('/api/user', RegisterUserRoute);

api.listen(config.apiPort);