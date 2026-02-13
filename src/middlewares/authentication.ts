import { Request, Response, NextFunction } from "express";
import { encrypt } from "../utils/crypt";
import { prisma } from "../services/prisma";

/*
api.get('/api/system', GETApiSystem);
api.get('/api/informations', GETApiInformations);
api.post('/api/user', RegisterUserRoute);
api.post('/api/user/:userId/auth', UserAuthRoute);
*/

const publicPaths = [
    /^\/api\/system$/,
    /^\/api\/informations$/,
    /^\/api\/user$/,
    /^\/api\/user\/\d+\/auth(\?.+)$/,
];

export default async function AuthenticationMiddleware(req: Request, res: Response, next: NextFunction) {
    for (const publicPath of publicPaths) {
        if (publicPath.test(req.path)) {
            return next();
        }
    }
    
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        // the game does not show messages anyway, but original SEGA's servers return errors like that
        return res.status(401).json(
            encrypt({
                httpStatus: 401,
                errorCode: '',
                errorMessage: '',
            })
        );
    }

    const credential = authHeader.split(' ')[1];
    if (!credential) {
        return res.status(401).json(
            encrypt({
                httpStatus: 401,
                errorCode: '',
                errorMessage: '',
            })
        );
    }

    const user = await prisma.user.findFirst({
        where: {
            credential
        }
    });

    if (!user) {
        return res.status(401).json(
            encrypt({
                httpStatus: 401,
                errorCode: '',
                errorMessage: '',
            })
        );
    }

    req.userId = user.userId;

    next();
}