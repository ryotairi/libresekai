// src/routes/RegisterUserRoute.ts

import { Request, Response } from 'express';
import { encrypt } from '../utils/crypt';
import { prisma } from '../services/prisma';
import { config } from '../config';
import { createCredential, createSignature } from '../utils/credentials';
import { generateUserId } from '../utils/random';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { UNITS } from '../consts/GameDataCons';
import { generateUpdatedResources } from '../utils/updatedResources';
import { z } from 'zod';
import logger from '../services/logger';

const initialAreas = JSON.parse(readFileSync('./json/initialUserAreas.json', 'utf-8'));

const RegisterUserSchema = z.object({
    platform: z.string(),
    deviceModel: z.string(),
    operatingSystem: z.string(),
});

export default async function RegisterUserRoute(req: Request, res: Response) {
    const parsed = RegisterUserSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error(`Failed to parse RegisterUserRoute payload...`, {
            body: req.body,
            headers: req.headers,
            parsed,
        });
        return res.status(422).send(
            encrypt({
                httpStatus: 422,
                errorCode: '',
                errorMessage: '',
            })
        );
    }

    const { platform, deviceModel, operatingSystem } = parsed.data;

    const userId = generateUserId();
    const user = await prisma.user.create({
        data: {
            deviceModel,
            operatingSystem,
            platform,
            name: config.initialPlayerName,
            credential: createCredential(userId),
            signature: createSignature(userId),
            userId,
        },
    });

    await prisma.userGameData.create({
        data: {
            userId: user.userId,
            coin: 0,
            deck: 1,
            exp: 0,
            totalExp: 0,
            rank: 1,
            virtualCoin: 0,
        },
    });

    await prisma.userBoostStatus.create({
        data: {
            userId: user.userId,
            current: 15,
            recoveryAt: new Date(Date.now() + 24 * 60 * 60 * 1e3),
        },
    });

    for (const cardId of config.initialFreeCards) {
        await prisma.card.create({
            data: {
                id: randomUUID(),
                userId: user.userId,
                cardId,
                level: 1,
                exp: 0,
                totalExp: 0,
                skillLevel: 1,
                skillExp: 0,
                totalSkillExp: 0,
                masterRank: 0,
                specialTrainingStatus: 'not_doing',
                defaultImage: 'original',
                duplicateCount: 0,
            },
        });
    }

    for (const area of initialAreas) {
        const userAreaData: any = {
            areaId: area.areaId,
            actionSets: area.actionSets,
            areaItems: area.areaItems,
            status: area.userAreaStatus.status,
            userId: user.userId,
        };

        if (area.userAreaStatus.userAreaPlaylistStatus) {
            userAreaData.userAreaPlaylistStatus = {
                create: {
                    areaPlaylistId: area.userAreaStatus.userAreaPlaylistStatus.areaPlaylistId,
                    status: area.userAreaStatus.userAreaPlaylistStatus.status,
                },
            };
        }

        await prisma.userArea.create({
            data: userAreaData,
        });
    }

    const cards = await prisma.card.findMany({
        where: { userId: user.userId },
    });

    await prisma.userDeck.create({
        data: {
            uniqueDeckId: randomUUID(),
            userId: user.userId,
            deckId: 1,
            name: 'Group 01',
            members: cards.slice(0, 5).map((card) => card.cardId),
        },
    });

    for (const musicId of config.initialMusics) {
        await prisma.userMusic.create({
            data: {
                musicId,
                userId: user.userId,
                uniqueMusicId: randomUUID(),
                vocals: config.initialMusicsVocals.find(x => x.musicId === musicId)?.vocals,
                availableDifficulties: ['easy', 'normal', 'hard', 'expert'],
            },
        });
    }

    for (let i = 1; i <= 26; i++) {
        await prisma.userCharacter.create({
            data: {
                characterId: i,
                userId: user.userId,
                uniqueCharacterId: randomUUID(),
            },
        });
    }

    for (const unitName of UNITS) {
        await prisma.userUnit.create({
            data: {
                uniqueUnitId: randomUUID(),
                userId: user.userId,
                userGameDataUserId: user.userId,
                unit: unitName as any,
            },
        });
    }

    const userRegistration = {
        userId: user.userId,
        signature: user.signature,
        platform: user.platform,
        deviceModel: user.deviceModel,
        operatingSystem: user.operatingSystem,
        registeredAt: user.registeredAt.getTime(),
    };

    const updatedResources = await generateUpdatedResources(user.userId);

    res.send(
        encrypt({
            userRegistration,
            credential: user.credential,
            updatedResources,
        })
    );
}
