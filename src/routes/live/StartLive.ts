import { Request, Response } from "express";
import { encrypt } from "../../utils/crypt";
import { prisma } from "../../services/prisma";
import { generateUpdatedResources } from "../../utils/updatedResources";
import { z } from "zod";

const StartLiveSchema = z.object({
    musicId: z.number(),
    musicDifficultyId: z.number(),
    musicVocalId: z.number(),
    deckId: z.number(),
    boostCount: z.number(),
    isAuto: z.boolean(),
    musicCategoryName: z.string(),
});

export default async function StartLive(req: Request, res: Response) {
    const { userId } = req;

    const parsed = StartLiveSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(422).send(
            encrypt({
                httpStatus: 422,
                errorCode: '',
                errorMessage: '',
            })
        );
    }

    const body = parsed.data;

    if (req.params.userId !== req.userId?.toString()) {
        return res.status(403).send(
            encrypt({
                httpStatus: 403,
                errorCode: 'session_error',
                errorMessage: ''
            })
        );
    }

    const user = await prisma.user.findFirst({
        where: {
            userId: BigInt(userId!)
        }
    });

    const live = await prisma.userLive.create({
        data: {
            userId: BigInt(userId!),
            liveId: crypto.randomUUID(),
            boostCount: body.boostCount,
            deckId: body.deckId,
            isAutoPlay: body.isAuto,
            musicDifficultyId: body.musicDifficultyId,
            musicId: body.musicId,
            musicVocalId: body.musicVocalId,
        }
    });

    await prisma.user.update({
        where: {
            userId: BigInt(userId!)
        },
        data: {
            userLive: {
                connect: {
                    userId: BigInt(userId!)
                }
            },
            userLiveId: live.liveId,
        }
    });

    res.send(
        encrypt({
            updatedResources: generateUpdatedResources(user!.userId)
        })
    );
}
