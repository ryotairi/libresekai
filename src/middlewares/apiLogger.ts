import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger';

export default function apiLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, path } = req;

    logger.info(`--> ${method} ${path}`);

    const originalSend = res.send.bind(res);
    res.send = function (body?: any) {
        const duration = Date.now() - start;
        const status = res.statusCode;

        if (status >= 400) {
            logger.error(`<-- ${method} ${path} ${status} (${duration}ms)`);
        } else {
            logger.info(`<-- ${method} ${path} ${status} (${duration}ms)`);
        }

        return originalSend(body);
    };

    next();
}
