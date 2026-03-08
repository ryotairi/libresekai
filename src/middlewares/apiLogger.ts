import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger';

export default function apiLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, path, host } = req;

    logger.info(`--> ${method} ${host}${path}`);

    const originalSend = res.send.bind(res);
    res.send = function (body?: any) {
        const duration = Date.now() - start;
        const status = res.statusCode;

        if (status >= 400) {
            logger.error(`<-- ${method} ${host}${path} ${status} (${duration}ms)`);
        } else {
            logger.info(`<-- ${method} ${host}${path} ${status} (${duration}ms)`);
        }

        return originalSend(body);
    };

    next();
}
