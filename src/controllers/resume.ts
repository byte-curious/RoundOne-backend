import { type Request, type Response } from "express"
import { v2 as cloudinary } from "cloudinary";
// import * as pdfParser from "pdf-parse";
//  as pdf-parser is a commonjs module, but import is ESM so we have to do this.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

import { prisma } from "../utils/database/db.js"


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!
});

function sanitizeResumeText(text: string): string {
  let cleaned = text;

  // Remove email addresses
  cleaned = cleaned.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    "[EMAIL REMOVED]"
  );

  // Remove Indian & international phone numbers
  cleaned = cleaned.replace(
    /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,6}\b/g,
    "[PHONE REMOVED]"
  );

  // Remove URLs
  cleaned = cleaned.replace(
    /\b(?:https?:\/\/|www\.)\S+\b/g,
    "[URL REMOVED]"
  );

  // Remove LinkedIn URLs
  cleaned = cleaned.replace(
    /linkedin\.com\/\S+/gi,
    "[LINKEDIN REMOVED]"
  );

  // Remove GitHub URLs
  cleaned = cleaned.replace(
    /github\.com\/\S+/gi,
    "[GITHUB REMOVED]"
  );

  // Remove common Indian PIN codes
  cleaned = cleaned.replace(/\b\d{6}\b/g, "[PIN REMOVED]");

  // Remove multiple separators left behind
  cleaned = cleaned.replace(/\s*\|\s*\|\s*/g, " | ");

  // Remove empty lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}


const uploadToCloudinary = (buffer: Buffer): Promise<any> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", folder: "resumes", timeout: 60000},
            (error, result) => {
                if (error) reject(error)
                else resolve(result)
            }
        );
        stream.end(buffer)
    });
};

const uploadResume = async (req: Request, res: Response) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ "error": "Resume file is required" })
        };
        
        const parser = new PDFParse({ data: file.buffer });
        const pdfData = await parser.getText();
        const extractedText = pdfData.text.trim();
        await parser.destroy();

        if (extractedText.length < 50) {
            return res.status(400).json({ error: "Invalid File" });
        };
        // checking extracted text
        // console.log(extractedText)
        // now senitise the extractedText
        const sanitizeExtractedText = sanitizeResumeText(extractedText);
        // console.log(sanitizeExtractedText);

        
        // check whether the resume is present in user'db 
        const isExisted = await prisma.resume.findUnique({
            where: {
                userId: req.user!.id
            }
        })

        //    const uploadToCloudinary
        const cloudinaryResult = await uploadToCloudinary(file.buffer);

        // if existed delete the previous file
        if (isExisted) {

             try {
                await cloudinary.uploader.destroy(isExisted.publicId, {
                    resource_type: "image"
                });
            } catch (deleteError) {
                console.log("Could not delete old resume from cloudinary, but continuing:", deleteError);
            }

            await prisma.resume.updateMany({
                data: {
                    extractedText: sanitizeExtractedText,
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
                    extractedText: sanitizeExtractedText,
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
