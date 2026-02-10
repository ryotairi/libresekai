import { Request, Response } from 'express';
import { encrypt } from '../utils/crypt';
import { prisma } from '../services/prisma';
import { config } from '../config';
import { randomCredentialString } from '../utils/credentials';
import { generateUserId } from '../utils/random';

type RegisterUserPayload = {
    platform: string;
    deviceModel: string;
    operatingSystem: string;
};

export default async function RegisterUserRoute(req: Request, res: Response) {
    const { body } = req;
    if (typeof body.platform !== 'string' || typeof body.deviceModel !== 'string' || typeof body.operatingSystem !== 'string') {
        return res
            .status(400)
            .send(
                encrypt(
                    {
                        httpStatus: 400,
                        errorCode: '',
                        errorMessage: ''
                    }
                )
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
        }
    });

    const gameData = await prisma.userGameData.create({
        data: {
            userId: user.userId,
            coin: 0,
            deck: 1,
            exp: 0,
            totalExp: 0,
            rank: 1,
            virtualCoin: 0
        }
    });

    const boostData = await prisma.userBoostStatus.create({
        data: {
            userId: user.userId,
            current: 15,
            recoveryAt: new Date(Date.now() + (24 * 60 * 60 * 1e3)),
        }
    });

    await prisma.user.update({
        where: { userId: user.userId },
        data: {
            boost: {
                upsert: {
                    create: boostData,
                    update: boostData
                }
            },
            gameData: {
                upsert: {
                    create: gameData,
                    update: gameData
                }
            }
        }
    });

    const userRegistration = {
        userId: user.userId,
        signature: user.signature,
        platform: user.platform,
        deviceModel: user.deviceModel,
        operatingSystem: user.operatingSystem,
        registeredAt: user.registeredAt
    };

    res.send(
        encrypt({
            userRegistration,
            credential: user.credential,
            updatedResources: {
                now: Date.now(),
                refreshableTypes: [],
                userRegistration,
                userGamedata: {
                    userId: user.userId,
                    name: user.name,
                    deck: gameData.deck, // its either length or current deck
                    rank: gameData.rank,
                    exp: gameData.exp,
                    totalExp: gameData.totalExp,
                    coin: gameData.coin,
                    virtualCoin: gameData.virtualCoin
                },
                userBoost: {

                }
            }
        })
    );
}