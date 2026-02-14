import { Request, Response } from "express";
import { encrypt } from "../utils/crypt";
import { prisma } from "../services/prisma";
import { generateUpdatedResources } from "../utils/updatedResources";

export default async function SetTutorialStatusRoute(req: Request, res: Response) {
    const { body } = req.body;
    if (typeof body.tutorialStatus !== 'string') {
        return res.status(422).send(
            encrypt({
                httpStatus: 422,
                errorCode: '',
                errorMessage: ''
            })
        );
    }

    if (req.params.userId !== req.userId?.toString()) {
        return res.status(422).send(
            encrypt({
                httpStatus: 422,
                errorCode: '',
                errorMessage: ''
            })
        );
    }

    // TODO: validate statuses against allowed value list
    // TODO: validate tutorial statuses, so users cant set tutorial status "gameplay" after they've completed it, etc

    await prisma.user.update({
        where: { userId: req.userId! },
        data: { tutorialStatus: body.tutorialStatus }
    });

    // iirc it should be like that
    res.send(
        encrypt({
            updatedResources: generateUpdatedResources(req.userId!)
        })
    );
}