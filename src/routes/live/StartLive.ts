import { Request, Response } from "express";
import { encrypt } from "../../utils/crypt";
import { prisma } from "../../services/prisma";
import { generateUpdatedResources } from "../../utils/updatedResources";

export default async function StartLive(req: Request, res: Response) {
    const {body, userId} = req;

    /*
    example body
    {
        "musicId": 50, // obvious
        "musicDifficultyId": 249, // i have some ideas about that. it is probably linked to updatedResources.
        "musicVocalId": 46, // same
        "deckId": 1, // the card group
        "boostCount": 3, // probably "energy drinks" amount?
        "isAuto": false,
        "musicCategoryName": "image" // probably how did you select the song.
}
    */

    // validate
    if (
        typeof body.musicId !== 'number' ||
        typeof body.musicDifficultyId !== 'number' ||
        typeof body.musicVocalId !== 'number' ||
        typeof body.deckId !== 'number' ||
        typeof body.boostCount !== 'number' ||
        typeof body.isAuto !== 'boolean' ||
        typeof body.musicCategoryName !== 'string'
    ) {
        return res.status(422).send(
            encrypt({
                httpStatus: 422,
                errorCode: '',
                errorMessage: '',
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