import { Request, Response, NextFunction } from 'express';

export function wrapDataMiddleware(req: Request, res: Response, next: NextFunction) {
    const originalJson = res.json;

    res.json = function (body: any) {
        if (!body || !body.data) {
            body = { data: body };
        }
        return originalJson.call(this, body);
    };

    next();
}