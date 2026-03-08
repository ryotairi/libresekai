// src/utils/updatedResources.ts

import { prisma } from '../services/prisma';
import { config } from '../config';
import { DIFFICULTIES } from '../consts/MusicCons';
import { convertDeckToSekaiDeck } from './payloads';

export async function generateUpdatedResources(userId: bigint) {
    const user = await prisma.user.findUniqueOrThrow({
        where: { userId },
    });

    const stamps = await prisma.userStamp.findMany({
        where: { userId },
    });

    const gameData = await prisma.userGameData.findUniqueOrThrow({
        where: { userId },
    });

    const areas = await prisma.userArea.findMany({
        where: { userId },
        include: {
            userAreaPlaylistStatus: true
        }
    });

    const shops = await prisma.userShop.findMany({
        where: { userId },
        include: {
            userShopItems: true
        }
    });

    const boostData = await prisma.userBoostStatus.findUniqueOrThrow({
        where: { userId },
    });

    const cards = await prisma.card.findMany({
        where: { userId },
    });

    const decks = await prisma.userDeck.findMany({
        where: { userId },
    });

    const musics = await prisma.userMusic.findMany({
        where: { userId },
    });

    const characters = await prisma.userCharacter.findMany({
        where: { userId },
    });

    const units = await prisma.userUnit.findMany({
        where: { userId },
    });

    const userRegistration = {
        userId: user.userId,
        signature: user.signature,
        platform: user.platform,
        deviceModel: user.deviceModel,
        operatingSystem: user.operatingSystem,
        registeredAt: user.registeredAt.getTime(),
        ...(user.birthdate ? {
            yearOfBirth: user.birthdate?.getFullYear(),
            monthOfBirth: user.birthdate?.getMonth() + 1,
            dayOfBirth: user.birthdate?.getDate(),
            age: (Date.now() - user.birthdate.getTime()) / 1000 / 60 / 60 / 24 / 365,
        } : {}),
    };

    const userCards = cards.map((card) => ({
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
        createdAt: card.createdAt.getTime(),
        episodes: [],
    }));

    const userDecks = decks.map(convertDeckToSekaiDeck);

    const userMusics = musics.map((music) => ({
        userId: music.userId,
        musicId: music.musicId,
        userMusicDifficultyStatuses: DIFFICULTIES.map((difficulty) => ({
            musicId: music.musicId,
            musicDifficulty: difficulty,
            musicDifficultyStatus: music.availableDifficulties.includes(difficulty)
                ? 'available'
                : 'forbidden',
            userMusicResults: [],
        })),
        userMusicVocals: [],
        userMusicAchievements: [],
        createdAt: music.createdAt.getTime(),
        updatedAt: music.updatedAt.getTime(),
    }));

    const userCharacters = characters.map((x) => ({
        characterId: x.characterId,
        characterRank: x.characterRank,
        exp: x.exp,
        totalExp: x.totalExp,
    }));

    const userUnits = units.map((x) => ({
        userId: x.userId,
        unit: x.unit,
        rank: x.rank,
        exp: x.exp,
        totalExp: x.totalExp,
    }));

    const archiveEventEpisodeStatuses = await prisma.userEpisodeStatus.findMany({
        where: {
            userId: user.userId,
            storyType: 'archive_event_story'
        },
    });

    const cardEpisodeStatuses = await prisma.userEpisodeStatus.findMany({
        where: {
            userId: user.userId,
            storyType: 'card_story'
        },
    });

    const characterProfileEpisodeStatuses = await prisma.userEpisodeStatus.findMany({
        where: {
            userId: user.userId,
            storyType: 'character_profile_story'
        },
    });

    const eventEpisodeStatuses = await prisma.userEpisodeStatus.findMany({
        where: {
            userId: user.userId,
            storyType: 'event_story'
        },
    });

    const specialEpisodeStatuses = await prisma.userEpisodeStatus.findMany({
        where: {
            userId: user.userId,
            storyType: 'special_story'
        },
    });

    const unitEpisodeStatuses = await prisma.userEpisodeStatus.findMany({
        where: {
            userId: user.userId,
            storyType: 'unit_story'
        },
    });

    return {
        now: Date.now(),
        refreshableTypes: [],
        userRegistration,
        userLiveId: user.userLiveId,
        userGamedata: {
            userId: user.userId,
            name: user.name,
            deck: gameData.deck,
            rank: gameData.rank,
            exp: gameData.exp,
            totalExp: gameData.totalExp,
            coin: gameData.coin,
            virtualCoin: gameData.virtualCoin,
        },
        userChargedCurrency: {
            paid: 0,
            free: gameData.crystals,
            paidUnitPrices: [],
        },
        userBoost: {
            current: boostData.current,
            recoveryAt: boostData.recoveryAt.getTime(),
        },
        userTutorial: {
            tutorialStatus: user.tutorialStatus,
        },
        userAreas: areas.map((x) => ({
            areaId: x.areaId,
            areaItems: x.areaItems,
            actionSets: x.actionSets,
            userAreaStatus: {
                areaId: x.areaId,
                status: x.status,
                ...(x.userAreaPlaylistStatus ? {
                    userAreaPlaylistStatus: {
                        areaPlaylistId: x.userAreaPlaylistStatus.areaPlaylistId,
                        status: x.userAreaPlaylistStatus.status
                    }
                } : {})
            }
        })),
        userCards,
        userDecks,
        userMusics,
        userMusicResults: [],
        userMusicAchievements: [],
        userShops: shops.map((x) => ({
            shopId: x.shopId,
            userShopItems: x.userShopItems.map((item) => ({
                shopItemId: item.shopItemId,
                level: item.level,
                status: item.status,
            })),
        })),
        userUnitEpisodeStatuses: unitEpisodeStatuses.map((x) => ({
            storyType: x.storyType,
            episodeId: x.episodeId,
            status: x.status,
            isNotSkipped: x.isNotSkipped,
        })),
        userSpecialEpisodeStatuses: specialEpisodeStatuses.map((x) => ({
            storyType: x.storyType,
            episodeId: x.episodeId,
            status: x.status,
            isNotSkipped: x.isNotSkipped,
        })),
        userEventEpisodeStatuses: eventEpisodeStatuses.map((x) => ({
            storyType: x.storyType,
            episodeId: x.episodeId,
            status: x.status,
            isNotSkipped: x.isNotSkipped,
        })),
        userArchiveEventEpisodeStatuses: archiveEventEpisodeStatuses.map((x) => ({
            storyType: x.storyType,
            episodeId: x.episodeId,
            status: x.status,
            isNotSkipped: x.isNotSkipped,
        })),
        userCharacterProfileEpisodeStatuses: characterProfileEpisodeStatuses.map((x) => ({
            storyType: x.storyType,
            episodeId: x.episodeId,
            status: x.status,
            isNotSkipped: x.isNotSkipped,
        })),
        userEventArchiveCompleteReadRewards: gameData.eventArchiveCompleteReadRewards,
        userUnits,
        userPresents: [],
        userCostume3dStatuses: [],
        userCostume3dShopItems: [],
        userCharacterCostume3ds: [],
        userReleaseConditions: [],
        unreadUserTopics: [],
        userHomeBanners: [],
        userStamps: stamps.map((x) => ({
            stampId: x.stampId,
            obtainedAt: x.obtainedAt.getTime(),
        })),
        userMaterialExchanges: [],
        userGachaCeilExchanges: [],
        userCharacters,
        userCharacterMissionV2s: [],
        userCharacterMissionV2Statuses: [],
        userBeginnerMissionBehavior: {
            userBeginnerMissionBehaviorType: 'beginner_mission_v2',
        },
        userMissionStatuses: [],
        userEventMissions: [],
        userProfile: {
            userId: user.userId,
            profileImageType: 'leader',
        },
        userHonorMissions: [],
        userVirtualShops: [],
        userArchiveVirtualLiveReleaseStatuses: [],
        userAvatar: {
            avatarSkinColorId: 1,
        },
        userAvatarCostumes: [{ avatarCostumeId: 1 }],
        userAvatarMotions: [],
        userAvatarMotionFavorites: [],
        userAvatarSkinColors: [{ avatarSkinColorId: 1 }],
        userRankMatchResult: {
            liveId: '',
            liveStatus: 'none',
        },
        userLiveCharacterArchiveVoice: {
            characterArchiveVoiceGroupIds: [],
        },
        userViewableAppeal: { appealIds: [1] },
        userBillingRefunds: [],
        userUnprocessedOrders: [],
        userRecommendgls: [],
        userInformations: config.informations,
        userPenlights: [{ penlightId: 1, favoriteFlg: true }],
    };
}
