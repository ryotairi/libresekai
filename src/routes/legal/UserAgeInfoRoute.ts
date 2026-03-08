import { Request, Response } from "express";
import { encrypt } from "../../utils/crypt";
import { prisma } from "../../services/prisma";

export default async function UserAgeInfoRoute(req: Request, res: Response) {
    if (req.params.userId !== req.userId?.toString()) {
        return res.status(403).send(
            encrypt({
                httpStatus: 403,
                errorCode: 'session_error',
                errorMessage: ''
            })
        );
    }

    const user = await prisma.user.findFirst({ where: { userId: req.userId! } });

    if (!user) {
        return res.status(403).send(
            encrypt({
                httpStatus: 403,
                errorCode: 'session_error',
                errorMessage: ''
            })
        );
    }

    res.send(
        encrypt({
            userId: user.userId,
            yearOfBirth: user.birthdate?.getFullYear(),
            monthOfBirth: user.birthdate ? user.birthdate?.getMonth() + 1 : null,
            dayOfBirth: user.birthdate?.getDate(),
            age: user.birthdate ? Math.floor((Date.now() - user.birthdate.getTime()) / 1000 / 60 / 60 / 24 / 365) : null
        })
    );
}