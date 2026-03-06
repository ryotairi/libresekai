import { Request, Response } from "express";
import { encrypt } from "../../utils/crypt";
import { z } from "zod";
import { generateUpdatedResources } from "../../utils/updatedResources";
import { prisma } from "../../services/prisma";

const PatchUserSchema = z.object({
    userGamedata: z.object({
        name: z.string().min(1),
    }).optional(),
    userRegistration: z.object({
        userId: z.int(),
        signature: z.any(),
        platform: z.any(),
        deviceModel: z.any(),
        operatingSystem: z.any(), // we don't need most of these params yet
        registeredAt: z.int(),
        yearOfBirth: z.int().min(1024).max(2026),
        monthOfBirth: z.int().min(1).max(12),
        dayOfBirth: z.int().min(1).max(31),
        age: z.int(), // seems to be always 0
        billableLimitAgeType: z.any(),
    }).optional(),
});

export default async function PatchUserRoute(req: Request, res: Response) {
    if (req.params.userId !== req.userId?.toString()) {
        return res.status(403).send(
            encrypt({
                httpStatus: 403,
                errorCode: 'session_error',
                errorMessage: ''
            })
        );
    }

    const { success, data } = PatchUserSchema.safeParse(req.body);

    if (success && (data.userGamedata || data.userRegistration)) {
        if (data.userGamedata) {
            await prisma.user.update({
                where: { userId: req.userId! },
                data: {
                    name: data.userGamedata.name,
                },
            });
        } else if (data.userRegistration) {
            await prisma.user.update({
                where: { userId: req.userId! },
                data: {
                    birthdate: new Date(`${data.userRegistration.yearOfBirth}-${data.userRegistration.monthOfBirth}-${data.userRegistration.dayOfBirth}`)
                }
            });
        }

        res.send(
            encrypt({
                updatedResources: await generateUpdatedResources(req.userId!),
            }),
        );
    } else {
        return res.status(422).send(
            encrypt({
                httpStatus: 422,
                errorCode: '',
                errorMessage: '',
            })
        );
    }
}
