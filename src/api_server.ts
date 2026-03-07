import express from 'express';
import { config } from './config';
import GETApiSystem from './routes/GetSystem';
import RegisterUserRoute from './routes/RegisterUserRoute';
import { decrypt } from './utils/crypt';
import UserAuthRoute from './routes/UserAuthRoute';
import GETApiInformations from './routes/GetInformationRoute';
import AuthenticationMiddleware from './middlewares/authentication';
import SetTutorialStatusRoute from './routes/SetTutorialStatusRoute';
import StartLive from './routes/live/StartLive';
import FinishLive from './routes/live/FinishLive';
import PatchUserRoute from './routes/user/PatchUserRoute';
import UserAgeInfoRoute from './routes/legal/UserAgeInfoRoute';
import SuiteMasterFileRoute from './routes/SuiteMasterFileRoute';

const api = express();

api.use(AuthenticationMiddleware);

api.use((req, res, next) => {
    if (req.headers['content-type'] === 'application/octet-stream') {
        const buffer = req.body as Buffer;
        const decryptedMsgPack = decrypt(buffer);
        req.body = decryptedMsgPack;
    }
    next();
});

api.get('/api/system', GETApiSystem);
api.get('/api/informations', GETApiInformations);
api.post('/api/user', RegisterUserRoute);

api.get('/api/suitemasterfile/:version/:fileName', SuiteMasterFileRoute);

api.get('/api/user/na/:userId/legal/ageinfo', UserAgeInfoRoute);

api.post('/api/user/:userId/auth', UserAuthRoute);
api.patch('/api/user/:userId/tutorial', SetTutorialStatusRoute);
api.patch('/api/user/:userId', PatchUserRoute);

api.post('/api/user/:userId/live', StartLive);
api.post('/api/user/:userId/live/:liveId', FinishLive);

api.listen(config.apiPort);