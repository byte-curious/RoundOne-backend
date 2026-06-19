import { type Request, type Response } from "express"
import { v2 as coudinary } from "cloudinary";
// import * as pdfParser from "pdf-parse";
//  as pdf-parser is a commonjs module, but import is ESM so we have to do this.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

import { prisma } from "../utils/database/db.js"


coudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!
});
const uploadToCloudinary = (buffer: Buffer): Promise<any> => {
    return new Promise((resolve, reject) => {
        const stream = coudinary.uploader.upload_stream(
            { resource_type: "auto", folder: "resumes" },
            (error, result) => {
                if (error) reject(error)
                else resolve(result)
            }
        );
        stream.end(buffer)
    });
};
/*
POST /upload-resume (protected)
  → check req.file exists → 400 if not
  → upload buffer to Cloudinary
  → pdf-parse extracts text from buffer
  → check extractedText length → 400 if too short
  → check if user already has a resume in DB
      → if yes → update existing record
      → if no  → create new record
  → save { userId, publicId, fileUrl, 
           extractedText, originalName } to DB
  → return 200 { message: "Resume uploaded successfully" }
*/
const uploadResume = async (req: Request, res: Response) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ "error": "Resume file is required" })
        };
        //    const uploadToCloudinary
        const cloudinaryResult = await uploadToCloudinary(file.buffer);

        const parser = new PDFParse({ data: file.buffer });
        const pdfData = await parser.getText();
        const extractedText = pdfData.text.trim();
        await parser.destroy();

        if (extractedText.length < 50) {
            return res.status(400).json({ error: "Invalid File" });
        };

        // check whether the resume is present in user'db 
        const isExisted = await prisma.resume.findUnique({
            where: {
                userId: req.user!.id
            }
        })

        if (isExisted) {
            await prisma.resume.updateMany({
                data: {
                    extractedText: extractedText,
                    fileUrl: cloudinaryResult.secure_url,
                    publicId: cloudinaryResult.public_id,
                    originalName: file.originalname
                },
                where: {
                    userId: req.user!.id
                }
            })
        }
        else {
            await prisma.resume.create({
                data: {
                    userId: req.user!.id,
                    publicId: cloudinaryResult.public_id,
                    originalName: file.originalname,
                    extractedText,
                    fileUrl: cloudinaryResult.secure_url
                }
            })
        }
        return res.status(200).json({ message: "Resume uploaded successfully." })

    } catch (error) {
        console.log(error)
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export { uploadResume }