import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../src/utils/database/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    try {
        console.log("Start seeding questions...");

        const dataPath = path.join(__dirname, "questions.secret.json");
        const rawData = fs.readFileSync(dataPath, "utf-8");
        const questions = JSON.parse(rawData);

        for (const q of questions) {
            await prisma.question.upsert({
                where: {
                    slug: q.slug,
                },

                // Existing question:
                // Do not update anything that belongs to user progress.
                update: {
                    title: q.title,
                    description: q.description,
                    topics: q.topics,
                    difficulty: q.difficulty,
                    companies: q.companies,
                },

                // New question:
                create: {
                    title: q.title,
                    slug: q.slug,
                    description: q.description,
                    topics: q.topics,
                    difficulty: q.difficulty,
                    companies: q.companies,
                    testCases: {
                        create: q.testCases,
                    },
                },
            });
        }

        console.log("Seeding completed successfully");
    } catch (error) {
        console.error("Seeding failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
