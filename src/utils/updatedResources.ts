// src/utils/updatedResources.ts

import { prisma } from '../services/prisma';
import { config } from '../config';
import { DIFFICULTIES } from '../consts/MusicCons';
import { convertDeckToSekaiDeck } from './payloads';

export async function generateUpdatedResources(userId: number | bigint) {
    const user = await prisma.user.findUniqueOrThrow({
        where: { userId },
    });

    const gameData = await prisma.userGameData.findUniqueOrThrow({
        where: { userId },
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
        registeredAt: user.registeredAt,
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
        createdAt: Math.floor(card.createdAt.getTime() / 1000),
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
        createdAt: Math.floor(music.createdAt.getTime() / 1000),
        updatedAt: Math.floor(music.updatedAt.getTime() / 1000),
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
        userBoost: {
            current: boostData.current,
            recoveryAt: Math.floor(boostData.recoveryAt.getTime() / 1000),
        },
        userTutorial: {
            tutorialStatus: user.tutorialStatus,
        },
        userAreas: user.areas,
        userCards,
        userDecks,
        userMusics,
        userMusicResults: [],
        userMusicAchievements: [],
        userShops: [],
        userUnitEpisodeStatuses: [],
        userSpecialEpisodeStatuses: [],
        userEventEpisodeStatuses: [],
        userArchiveEventEpisodeStatuses: [],
        userCharacterProfileEpisodeStatuses: [],
        userEventArchiveCompleteReadRewards: [],
        userUnits,
        userPresents: [],
        userCostume3dStatuses: [],
        userCostume3dShopItems: [],
        userCharacterCostume3ds: [],
        userReleaseConditions: [],
        unreadUserTopics: [],
        userHomeBanners: [],
        userStamps: [],
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