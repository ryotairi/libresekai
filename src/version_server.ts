import express from 'express';
import { config } from './config';
import { encrypt } from './utils/crypt';
import apiLoggerMiddleware from './middlewares/apiLogger';

const versionServer = express();

versionServer.use(apiLoggerMiddleware);

versionServer.get('/:appVersion/:appHash', (req, res) => {
    res.contentType('application/octet-stream').send(
        encrypt(config.versionData[`${req.params.appVersion}/${req.params.appHash}`])
    );
});

versionServer.listen(config.versionPort);