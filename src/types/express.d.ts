declare module Express {
    interface Request {
        userId?: bigint | number;
    }
}