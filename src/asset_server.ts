import express from 'express';
import { config } from './config';
import { matchAssetDomain } from './utils/assetDomain';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'fs';
import { encrypt } from './utils/crypt';
import logger from './services/logger';
import apiLoggerMiddleware from './middlewares/apiLogger';

const android = JSON.parse(readFileSync('assets/android.json', 'utf-8'));

const app = express();

app.use(apiLoggerMiddleware);

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

app.get('/:version/:hash/:platform/*assetPath', async (req, res) => {
    const { version, hash, platform } = req.params;
    const assetPath = Array.isArray(req.params.assetPath) ? req.params.assetPath.join('/') : (req.params.assetPath || '');

    if (req.assetDomain?.type !== 'assetbundleUrl' || platform !== 'android' || version !== config.versions[config.latestVersion].appVersion) {
        return res.status(404).send(
            encrypt({
                httpStatus: 404,
                errorCode: 'not_found',
                errorMessage: ''
            })
        );
    }

    const isStoredLocally = existsSync(`assets/${assetPath}`);
    if (!isStoredLocally) {
        try {
            const date = new Date();
            const mo = `0${date.getMonth() + 1}`;
            const t = `${date.getFullYear()}${mo.substring(mo.length - 2, mo.length)}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
            const f = await fetch(`${config.upstreamAssetUrl}/${platform}/${assetPath}?t=${t}`);
            if (!f.ok) throw new Error(`${f.status} ${f.statusText}: ${await f.text()}`);

            const buffer = Buffer.from(await f.arrayBuffer());
            writeFileSync(`assets/${assetPath}`, buffer);
            logger.info(`Successfully downloaded: ${assetPath}`);
        } catch (error: Error | unknown) {
            logger.error(`Failed to download ${assetPath}.`, error);
        }
    }

    res.sendFile(realpathSync(`assets/${assetPath}`));
});

app.listen(config.assetsPort);
