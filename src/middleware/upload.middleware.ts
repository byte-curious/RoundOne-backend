// multer config is here
import multer from "multer"

const memUpload = multer({
    storage : multer.memoryStorage(), 
    limits : {fileSize : 5 * 1024 * 1024},
    fileFilter : (req, file, cb) => cb(null, file.mimetype === "application/pdf")
});

export {memUpload}