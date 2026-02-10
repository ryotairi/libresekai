import { Request, Response } from "express";
import { encrypt } from "../utils/crypt";
import { config } from "../config";

export default async function GETApiSystem(req: Request, res: Response) {
    res.contentType('application/octet-stream').send(
        encrypt({
            serverDate: Date.now(),
            timezone: 'UTC',
            profile: 'production',
            maintenanceStatus: config.maintenanceStatus,
            appVersions: config.versions
        })
    );
}