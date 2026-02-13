// src/routes/RegisterUserRoute.ts

import { Request, Response } from 'express';
import { encrypt } from '../utils/crypt';
import { prisma } from '../services/prisma';
import { config } from '../config';
import { randomCredentialString } from '../utils/credentials';
import { generateUserId } from '../utils/random';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { UNITS } from '../consts/GameDataCons';
import { generateUpdatedResources } from '../utils/updatedResources';

const initialAreas = JSON.parse(readFileSync('./json/initialUserAreas.json', 'utf-8'));

type RegisterUserPayload = {
    platform: string;
    deviceModel: string;
    operatingSystem: string;
};

export default async function RegisterUserRoute(req: Request, res: Response) {
    const { body } = req;
    if (
        typeof body.platform !== 'string' ||
        typeof body.deviceModel !== 'string' ||
        typeof body.operatingSystem !== 'string'
    ) {
        return res.status(400).send(
            encrypt({
                httpStatus: 400,
                errorCode: '',
                errorMessage: '',
            })
        );
    }

    const { platform, deviceModel, operatingSystem }: RegisterUserPayload = body;

    const user = await prisma.user.create({
        data: {
            deviceModel,
            operatingSystem,
            platform,
            name: config.initialPlayerName,
            credential: randomCredentialString(),
            signature: randomCredentialString(),
            userId: generateUserId(),
            areas: initialAreas,
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
        registeredAt: user.registeredAt,
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