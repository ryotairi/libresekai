import { Request, Response } from "express";
import { encrypt } from "../utils/crypt";
import { config } from "../config";
import { prisma } from "../services/prisma";

export default async function UserAuthRoute(req: Request, res: Response) {
    const { body } = req;
    // required STRING field - credential
    if (!body.credential || typeof body.credential !== 'string') {
        return res.status(400).send(
            encrypt({
                httpStatus: 400,
                errorCode: '',
                errorMessage: ''
            })
        );
    }
    const latestVersion = config.versions[config.latestVersion];
    const { credential } = body;

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
            assetHash: '099130e0-88d0-4e29-8e4c-fd9192a06bae', // reverse engineer this logic later.
            appVersionStatus: latestVersion.appVersionStatus,
            isStreamingVirtualLiveForceOpenUser: false, // idk what is this
            deviceId: '00000000-0000-0000-0000-000000000000', // generate this later
            updatedResources: {}, // todo
            suiteMasterSplitPath: [],
            obtainedBondsRewardIds: [], // todo
        })
    );
}