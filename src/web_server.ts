import express from 'express';
import { config } from './config';
import { readFileSync } from 'fs';

const agegate = JSON.parse(readFileSync('./json/agegate.json', 'utf-8'));

const web = express();

web.get(/^\/json\/legals_[a-z]{2}\.json/g, (req, res) => {
    res.send({
        PP: config.legal.privacyPolicy,
        TOU: config.legal.termsOfUse
    });
});

web.get('/json/legals_version.json', (req, res) => {
    res.send({
        L: 1,
        C: 2
    });
});

web.get('/json/agegate.json', (req, res) => {
    res.send(agegate);
});

web.listen(config.webPort);