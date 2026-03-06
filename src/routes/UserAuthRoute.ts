import { Request, Response } from "express";
import { encrypt } from "../utils/crypt";
import { config } from "../config";
import { prisma } from "../services/prisma";
import { generateUpdatedResources } from "../utils/updatedResources";
import { z } from "zod";

const UserAuthSchema = z.object({
    credential: z.string().min(1),
});

export default async function UserAuthRoute(req: Request, res: Response) {
    const parsed = UserAuthSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(422).send(
            encrypt({
                httpStatus: 422,
                errorCode: '',
                errorMessage: ''
            })
        );
    }
    const latestVersion = config.versions[config.latestVersion];
    const { credential } = parsed.data;

    const user = await prisma.user.findFirst({
        where: {
            credential: credential as string
        }
    });
    if (!user) {
        return res.status(404).send(
            encrypt({
                httpStatus: 404,
                errorCode: '',
                errorMessage: 'User not found'
            })
        );
    }
    // We will return credential as session token for now

    res.send(
        encrypt({
            sessionToken: user.credential,
            appVersion: latestVersion.appVersion,
            multiPlayVersion: latestVersion.multiPlayVersion,
            assetVersion: latestVersion.assetVersion,
            removeAssetVersion: '1.3.1.0',
            assetHash: config.assetHash, // reverse engineer this logic later.
            appVersionStatus: latestVersion.appVersionStatus,
            isStreamingVirtualLiveForceOpenUser: false, // idk what is this
            deviceId: '00000000-0000-0000-0000-000000000000', // generate this later
            updatedResources: req.query.refreshUpdatedResources === 'False'
                ? {}
                : generateUpdatedResources(user.userId),
            suiteMasterSplitPath: [
                ''
            ],
            obtainedBondsRewardIds: [], // todo
        })
    );
}
