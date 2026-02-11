type UserDeck = {
    userId: bigint | number;
    deckId: number;
    name: string;
    members: number[]; // member1, member2, member3, member4, member5
};

type SekaiPayloadUserDeck = {
    userId: bigint | number;
    deckId: number;
    name: string;
    leader: number;
    subLeader: number;
    member1: number;
    member2: number;
    member3: number;
    member4: number;
    member5: number;
};

export function convertDeckToSekaiDeck(deck: UserDeck): SekaiPayloadUserDeck {
    return {
        userId: deck.userId,
        deckId: deck.deckId,
        name: deck.name,
        leader: deck.members[0],
        subLeader: deck.members[1],
        member1: deck.members[0],
        member2: deck.members[1],
        member3: deck.members[2],
        member4: deck.members[3],
        member5: deck.members[4],
    };
}