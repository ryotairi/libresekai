import { Request, Response } from "express";
import { encrypt } from "../utils/crypt";
import { existsSync, readFileSync } from "fs";

export default async function SuiteMasterFileRoute(req: Request, res: Response) {
    const {version, fileName} = req.params;

    if (typeof fileName !== 'string' || !existsSync(`suitemasterfile/${fileName}`)) {
        return res.status(404).send(
            encrypt({
                httpStatus: 404,
                errorCode: 'not_found',
                errorMessage: ''
            })
        );
    }

    const json = JSON.parse(readFileSync(`suitemasterfile/${fileName}`, 'utf-8'));

    res.send(
        encrypt(json)
    );
}