import fs from "fs";
import path from "path";
import {prisma} from "../src/utils/database/db.js"

// __dirname ESM me paya hi nhi jata
import {fileURLToPath} from "url"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main(){
    try {
        console.log("Start seeding question...");
        const dataPath = path.join(__dirname, "questions.secret.json");
        const rawData =   fs.readFileSync(dataPath, "utf-8");
        const questions = JSON.parse(rawData);
        // console.log(questions);

        for(const q of questions){
            const isExisting = await prisma.question.findFirst({
                where: {slug: q.slug}
            });

            if(!isExisting){
                // naya question aaya h add to prisma
                await prisma.question.create({
                    data: {
                        title: q.title, 
                        slug: q.slug,
                        description: q.description,
                        topics : q.topics,
                        difficulty: q.difficulty,
                        companies: q.companies,
                        testCases: {
                            create: q.testCases
                        }
                    }
                })
            }
        }
        console.log("seeding completed");

    } catch (error) {
        console.log(error);
    }
}
main()
