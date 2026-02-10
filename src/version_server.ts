import express from 'express';
import { config } from './config';
import { encrypt } from './utils/crypt';

const versionServer = express();

versionServer.get('/5.0.5/218d9a70-f3b7-4d1b-ba83-c9f85af283e6', (req, res) => {
    res.contentType('application/octet-stream').send(
        encrypt({
            profile: 'production',
            assetbundleHostHash: '846c90c1',
            domain: config.apiDomain
        })
    );
});

versionServer.listen(config.versionPort);