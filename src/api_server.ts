import express from 'express';
import { config } from './config';
import GETApiSystem from './routes/GetSystem';
import RegisterUserRoute from './routes/RegisterUserRoute';
import { decrypt } from './utils/crypt';
import UserAuthRoute from './routes/UserAuthRoute';
import GETApiInformations from './routes/GetInformationRoute';

const api = express();

api.use((req, res, next) => {
    if (req.headers['content-type'] === 'apilication/octet-stream') {
        const buffer = req.body as Buffer;
        const decryptedMsgPack = decrypt(buffer);
        req.body = decryptedMsgPack;
    }
});

api.get('/api/system', GETApiSystem);
api.get('/api/informations', GETApiInformations);
api.post('/api/user', RegisterUserRoute);
api.post('/api/user/:userId/auth', UserAuthRoute);

api.listen(config.apiPort);