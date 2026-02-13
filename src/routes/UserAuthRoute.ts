import { Request, Response } from "express";
import { encrypt } from "../utils/crypt";
import { config } from "../config";
import { prisma } from "../services/prisma";

export default async function UserAuthRoute(req: Request, res: Response) {
    const { body } = req;
    // required STRING field - credential
    if (!body.credential || typeof body.credential !== 'string') {
        return res.status(400).send(
            encrypt({
                httpStatus: 400,
                errorCode: '',
                errorMessage: ''
            })
        );
    }
    const latestVersion = config.versions[config.latestVersion];
    const { credential } = body;

    const user = await prisma.user.findFirst({
        where: {
            credential: credential as string
        }
    });
    if (!user) {
        return res.status(404).send(
            encrypt({
                httpStatus: 404,
                errorCode: '',
                errorMessage: 'User not found'
            })
        );
    }
    
}