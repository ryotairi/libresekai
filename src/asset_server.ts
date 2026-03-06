import express from 'express';
import { config } from './config';
import { matchAssetDomain } from './utils/assetDomain';
import { readFileSync } from 'fs';
import { encrypt } from './utils/crypt';

const android = JSON.parse(readFileSync('assets/android.json', 'utf-8'));

const app = express();

// Middleware to identify which asset domain was requested
// and extract {0}/{1} placeholders from assetbundleUrl/assetbundleInfoUrl
app.use((req, res, next) => {
    const hostname = req.hostname;
    const match = matchAssetDomain(hostname);

    if (match) {
        req.assetDomain = match;
    }

    next();
});

app.get('/api/version/:version/os/:platform', (req, res) => {
    if (req.assetDomain?.type !== 'assetbundleInfoUrl' || req.params.platform !== 'android') {
        return res.status(404).send(
            encrypt({
                httpStatus: 404,
                errorCode: 'not_found',
                errorMessage: ''
            })
        );
    }

    res.send(
        encrypt(android)
    );
});

app.get('/:version/:hash/:platform/*', (req, res) => {
    const { version, hash, platform } = req.params;
    const assetPath = req.params[''] ? req.params[''].join('/') : ''; // everything after /:version/:hash/:platform/

    if (req.assetDomain?.type !== 'assetbundleUrl' || platform !== 'android' || version !== config.versions[config.latestVersion].appVersion) {
        return res.status(404).send(
            encrypt({
                httpStatus: 404,
                errorCode: 'not_found',
                errorMessage: ''
            })
        );
    }
    
    // TODO: either serve from /assets , or download from official servers
});

app.listen(config.assetsPort);
