import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../database";
import { Post } from "../models/post_model";

const USER_ID = process.argv[2]; // pass userID as CLI arg

const topics = ["travel", "food", "tech", "music", "sports", "art", "science", "gaming", "fashion", "nature"];
const adjectives = ["amazing", "beautiful", "terrible", "incredible", "boring", "exciting", "shocking", "lovely", "strange", "perfect"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollDice(): number {
  return randomInt(1, 6);
}

function makeTitle(i: number) {
  const topic = topics[i % topics.length];
  const adj = adjectives[randomInt(0, adjectives.length - 1)];
  return `Post ${i + 1}: ${adj} ${topic} story`;
}

function makeContent(i: number) {
  const topic = topics[i % topics.length];
  return `This is post number ${i + 1} about ${topic}. ${adjectives[randomInt(0, adjectives.length - 1)]} things happened. Index: ${i}.`;
}

function makeMedia(i: number) {
  return {
    url: `https://picsum.photos/seed/${i}/800/600`,
    public_id: `blog_app/seed_${i}`,
  };
}

async function seed() {
  if (!USER_ID) {
    console.error("Usage: ts-node src/scripts/seed_posts.ts <userID>");
    process.exit(1);
  }

  await connectDB();

  const BATCH_SIZE = 500;
  const TOTAL = 10000;
  const ownerObjectId = new mongoose.Types.ObjectId(USER_ID);

  console.log(`Seeding ${TOTAL} posts for user ${USER_ID}...`);

  for (let batch = 0; batch < TOTAL / BATCH_SIZE; batch++) {
    const posts = [];

    for (let j = 0; j < BATCH_SIZE; j++) {
      const i = batch * BATCH_SIZE + j;
      const dice = rollDice();

      let content: string | undefined;
      let media_url: { url: string; public_id: string } | undefined;

      if (dice === 6) {
        // file only
        media_url = makeMedia(i);
      } else if (dice === 3) {
        // content only
        content = makeContent(i);
      } else if (dice === 2) {
        // both
        content = makeContent(i);
        media_url = makeMedia(i);
      } else {
        // 1, 4, 5 — title only
      }

      posts.push({ owner: ownerObjectId, title: makeTitle(i), content, media_url });
    }

    await Post.insertMany(posts);
    console.log(`Inserted batch ${batch + 1}/${TOTAL / BATCH_SIZE}`);
  }

  console.log("Done!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});