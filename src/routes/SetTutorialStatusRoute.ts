import { Request, Response } from "express";
import { encrypt } from "../utils/crypt";
import { prisma } from "../services/prisma";
import { generateUpdatedResources } from "../utils/updatedResources";
import { z } from "zod";

const SetTutorialStatusSchema = z.object({
    tutorialStatus: z.string(),
});

export default async function SetTutorialStatusRoute(req: Request, res: Response) {
    const parsed = SetTutorialStatusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(422).send(
            encrypt({
                httpStatus: 422,
                errorCode: '',
                errorMessage: ''
            })
        );
    }

    if (req.params.userId !== req.userId?.toString()) {
        return res.status(403).send(
            encrypt({
                httpStatus: 403,
                errorCode: 'session_error',
                errorMessage: ''
            })
        );
    }

    // TODO: validate statuses against allowed value list
    // TODO: validate tutorial statuses, so users cant set tutorial status "gameplay" after they've completed it, etc

    await prisma.user.update({
        where: { userId: req.userId! },
        data: { tutorialStatus: parsed.data.tutorialStatus }
    });

    // iirc it should be like that
    res.send(
        encrypt({
            updatedResources: generateUpdatedResources(req.userId!)
        })
    );
}
