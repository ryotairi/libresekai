import express, { Request, Response, NextFunction } from 'express';
import { config } from './config';
import GETApiSystem from './routes/GetSystem';
import RegisterUserRoute from './routes/RegisterUserRoute';
import { decrypt, encrypt } from './utils/crypt';
import UserAuthRoute from './routes/UserAuthRoute';
import GETApiInformations from './routes/GetInformationRoute';
import AuthenticationMiddleware from './middlewares/authentication';
import SetTutorialStatusRoute from './routes/SetTutorialStatusRoute';
import StartLive from './routes/live/StartLive';
import FinishLive from './routes/live/FinishLive';
import PatchUserRoute from './routes/user/PatchUserRoute';
import UserAgeInfoRoute from './routes/legal/UserAgeInfoRoute';
import SuiteMasterFileRoute from './routes/SuiteMasterFileRoute';
import apiLoggerMiddleware from './middlewares/apiLogger';
import logger from './services/logger';

const api = express();

api.use(express.raw({ type: 'application/octet-stream' }));

api.use(apiLoggerMiddleware);

api.use(AuthenticationMiddleware);

api.use((err: Error | unknown | null, req: Request, res: Response, next: NextFunction) => {
    if (err) {
        logger.error(`Error in ${req.url}`, err);
    } else {
        next();
    }
});

api.use((req, res, next) => {
    if (req.headers['content-type'] === 'application/octet-stream') {
        const buffer = req.body as Buffer;
        if (!buffer || buffer.length === 0) {
            return next();
        }
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

// Error handling middleware
api.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error(`Unhandled error on ${req.method} ${req.path}: ${err.message}`, err);
    res.status(500).send(
        encrypt({
            httpStatus: 500,
            errorCode: 'internal_server_error',
            errorMessage: '',
        })
    );
});

api.listen(config.apiPort);
