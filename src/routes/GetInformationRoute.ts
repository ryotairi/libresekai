import { Request, Response } from "express";
import { encrypt } from "../utils/crypt";
import { config } from "../config";

export default async function GETApiInformations(req: Request, res: Response) {
    res.contentType('application/octet-stream').send(
        encrypt({
            informations: config.informations
        })
    );
}