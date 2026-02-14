import { Request, Response } from "express";
import { encrypt } from "../../utils/crypt";
import { prisma } from "../../services/prisma";
import logger from "../../services/logger";
import { config } from "../../config";
import { generateUpdatedResources } from "../../utils/updatedResources";

export default async function FinishLive(req: Request, res: Response) {
    const { body, userId } = req;

    if (
        typeof body.score !== 'number'
        || typeof body.perfectCount !== 'number'
        || typeof body.greatCount !== 'number'
        || typeof body.goodCount !== 'number'
        || typeof body.badCount !== 'number'
        || typeof body.missCount !== 'number'
        || typeof body.score !== 'number'
        || typeof body.maxCombo !== 'number'
        || typeof body.life !== 'number'
        || typeof body.tapCount !== 'number'
        || typeof body.musicCategoryName !== 'string' // havent encountered anything other than image yet
        || typeof body.isMirrored !== 'boolean'
        || typeof body.ingameCutinCharacterArchiveVoiceGroupIds !== 'object'
        || !Array.isArray(body.ingameCutinCharacterArchiveVoiceGroupIds)
    ) {
        return res.status(422).send(
            encrypt({
                httpStatus: 422,
                errorCode: '',
                errorMessage: '',
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

    const user = (await prisma.user.findFirst({ where: { userId: req.userId! } }))!;
    const userLiveId = req.params.liveId;

    if (user.userLiveId != userLiveId) {
        logger.error(`${user.name} (${user.userId}) tried to finish solo live ${userLiveId}, but they are in ${user.userLiveId}.`);
        return res.status(409).send(
            encrypt({
                httpStatus: 409,
                errorCode: '',
                errorMessage: ''
            })
        );
    }

    const live = await prisma.userLive.findFirst({
        where: {
            liveId: userLiveId
        }
    });

    if (!live) {
        logger.error(`${user.name} (${user.userId}) tried to finish solo live ${userLiveId}, but that live does not exist.`);
        return res.status(400).send(
            encrypt({
                httpStatus: 400,
                errorCode: '',
                errorMessage: ''
            })
        );
    }

    logger.info(`${user.name} (${user.userId}) has finished solo live ${userLiveId}. PERFECT: ${body.perfectCount}, GREAT: ${body.greatCount}, GOOD: ${body.goodCount}, BAD: ${body.badCount}, MISS: ${body.missCount}, LIFE: ${body.life}, MAX COMBO: ${body.maxCombo}, SCORE: ${body.score}`);
    if (config.deleteLiveDataAfterFinishing) {
        await prisma.userLive.delete({ where: { liveId: userLiveId, userId: req.userId! } });
    } else {
        await prisma.userLive.update({
            where: { liveId: userLiveId, userId: req.userId! },
            data: {
                perfectCount: body.perfectCount,
                greatCount: body.greatCount,
                goodCount: body.goodCount,
                badCount: body.badCount,
                missCount: body.missCount,
                score: body.score,
                life: body.life,
                maxCombo: body.maxCombo,
                tapCount: body.tapCount,
            }
        });
    }

    res.send(
        encrypt({
            updatedResources: generateUpdatedResources(req.userId!)
        })
    );
}