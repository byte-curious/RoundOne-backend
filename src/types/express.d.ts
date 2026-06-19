import type {Buffer}  from "buffer";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
      }
      file?: {
        fieldname: string
        originalname: string
        encoding: string
        mimetype: string
        buffer: Buffer
        size: number
      }
    }
  }
}

export { }