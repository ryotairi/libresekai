import { Request, Response } from 'express';
import { encrypt } from '../utils/crypt';
import { prisma } from '../services/prisma';
import { config } from '../config';
import { randomCredentialString } from '../utils/credentials';
import { generateUserId } from '../utils/random';
import { readFileSync } from 'fs';
import { DIFFICULTIES } from '../consts/MusicCons';
import { randomUUID } from 'crypto';
import { convertDeckToSekaiDeck } from '../utils/payloads';

const initialAreas = JSON.parse(readFileSync('./json/initialUserAreas.json', 'utf-8'));

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
            areas: initialAreas
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

    // TODO: randomise free cards, probably based on which unit they select (idk how thats passed to the server tho.)
    // units: leo/need, more more jump, vivid bad squad, wonderlands x showtime, nightcord at 25:00
    for (const cardId of config.initialFreeCards) {
        await prisma.card.create({
            data: {
                id: randomUUID(), // not used by client, only for server internal use
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
            }
        });
    }

    const cards = await prisma.card.findMany({
        where: {
            userId: user.userId
        }
    });

    const userCards = [];

    for (const card of cards) {
        userCards.push({
            userId: card.userId,
            cardId: card.cardId,
            level: card.level,
            exp: card.exp,
            totalExp: card.totalExp,
            skillLevel: card.skillLevel,
            skillExp: card.skillExp,
            totalSkillExp: card.totalSkillExp,
            masterRank: card.masterRank,
            specialTrainingStatus: card.specialTrainingStatus,
            defaultImage: card.defaultImage,
            duplicateCount: card.duplicateCount,
            createdAt: Math.floor(card.createdAt.getTime() / 1000),
            episodes: [] // TODO implement episodes
        });
    }

    const deck = await prisma.userDeck.create({
        data: {
            uniqueDeckId: randomUUID(), // not used by client, only for server internal use
            userId: user.userId,
            deckId: 1,
            name: 'Group 01',
            members: userCards.slice(0, 5).map(card => card.cardId),
        }
    });

    const userDecks: any[] = [
        deck
    ];
    const userMusics: any[] = [];

    for (const musicId of config.initialMusics) {
        await prisma.userMusic.create({
            data: {
                musicId: musicId,
                userId: user.userId,
                uniqueMusicId: randomUUID(),
                availableDifficulties: ['easy', 'normal', 'hard', 'expert'], // TODO add extra difficulty if available
            }
        });
    }

    const musics = await prisma.userMusic.findMany({
        where: {
            userId: user.userId
        }
    });

    for (const music of musics) {
        userMusics.push({
            userId: music.userId,
            musicId: music.musicId,
            userMusicDifficultyStatuses: DIFFICULTIES.map((diffuculty) => ({
                musicId: music.musicId,
                musicDifficulty: diffuculty,
                musicDifficultyStatus: music.availableDifficulties.includes(diffuculty)
                    ? 'available'
                    : 'forbidden',
                userMusicResults: [], // no idea on that rn
            })),
            userMusicVocals: [], // TODO implement vocals
            userMusicAchievements: [], // TODO implement achievements
            createdAt: Math.floor(music.createdAt.getTime() / 1000),
            updatedAt: Math.floor(music.updatedAt.getTime() / 1000)
        });
    }

    // there is a lot of work to be done.
    // see /registered.json for example register response body.

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
                    current: boostData.current,
                    recoveryAt: Math.floor(boostData.recoveryAt.getTime() / 1000),
                },
                userTutorial: {
                    tutorialStatus: user.tutorialStatus, // its always "start"
                },
                userAreas: user.areas, // TODO proper areas handling
                userCards,
                userDecks: userDecks.map(convertDeckToSekaiDeck),
                userMusics,
                userMusicResults: [],
                userMusicAchievements: [],
                userShops: [], // TODO implement thats important
                userUnitEpisodeStatuses: [],
                userSpecialEpisodeStatuses: [],
                userEventEpisodeStatuses: [],
                userArchiveEventEpisodeStatuses: [],
                userCharacterProfileEpisodeStatuses: [],
                userEventArchiveCompleteReadRewards: [],
                userUnits: [],
                userPresents: [], // TODO
                userCostume3dStatuses: [],
                userCostume3dShopItems: [],
                userCharacterCostume3ds: [],
                userReleaseConditions: [],
                unreadUserTopics: [],
                userHomeBanners: [],
                userStamps: [], // TODO implement default stamps
                userMaterialExchanges: [],
                userGachaCeilExchanges: [],
                userCharacters: [], // TODO IMPORTANT!
                userCharacterMissionV2s: [],
                userCharacterMissionV2Statuses: [],
                userBeginnerMissionBehavior: {
                    userBeginnerMissionBehaviorType: 'beginner_mission_v2',
                },
                userMissionStatuses: [],
                userEventMissions: [],
                userProfile: {
                    userId: user.userId,
                    profileImageType: 'leader', // idk other values yet
                },
                userHonorMissions: [], // todo!
                userVirtualShops: [], // TODO
                userArchiveVirtualLiveReleaseStatuses: [],
                userAvatar: {
                    avatarSkinColorId: 1, // todo
                },
                userAvatarCostumes: [{ avatarCostumeId: 1 }],
                userAvatarMotions: [],
                userAvatarMotionFavorites: [],
                userAvatarSkinColors: [{ avatarSkinColorId: 1 }], // TODO implement persistence, 1-14
                userRankMatchResult: {
                    liveId: '',
                    liveStatus: 'none',
                }, // probably ranked shows
                userLiveCharacterArchiveVoice: {
                    characterArchiveVoiceGroupIds: [], // THERE ARE A LOT OF NUMBERS AND I HAVE NO IDEA WHAT THEY ARE FOR
                },
                userViewableAppeal: { appealIds: [1] },
                userBillingRefunds: [],
                userUnprocessedOrders: [],
                userRecommendgls: [],
                userInformations: config.informations
            }
        })
    );
}