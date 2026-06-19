import jwt from "jsonwebtoken";
import { type Request, type Response, NextFunction } from "express"

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string
            }
        }
    }
}

const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token
        if (!token) {
            return res.status(403).json({ "error": "token not present" })
        };
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: "Server configuration error" })
        }
        const decode = jwt.verify(token, secret)as {id : string};
        req.user = {id : decode.id}
        next()
    } catch (error) {
        console.error(error)
        return res.status(500).json({ "error": "Internal Server Error" })
    }
};

export { auth }