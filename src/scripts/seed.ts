import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../database";
import { User } from "../models/user_model";
import { Post } from "../models/post_model";
import { Comment } from "../models/comment_model";
import { Reaction } from "../models/reaction_model";
import { CommentableType } from "../types/model_types/IComment";
import { ReactableType, ReactionValue } from "../types/model_types/IReaction";

// ── Config ────────────────────────────────────────────────────────────────────
const SEED_USER_COUNT = 99;    // + existing users = ~100 total
const TOTAL_POSTS = 500;
const POST_BATCH_SIZE = 100;
const COMMENTS_PER_POST = 3;
const REPLIES_PER_COMMENT = 2;
// ─────────────────────────────────────────────────────────────────────────────

const firstNames = ["Liam","Emma","Noah","Olivia","Ethan","Ava","James","Sophia","Lucas","Isabella","Mason","Mia","Logan","Amelia","Aiden","Harper","Jackson","Evelyn","Sebastian","Abigail","Owen","Emily","Carter","Elizabeth","Wyatt","Sofia","Dylan","Avery","Jack","Ella","Grayson","Scarlett","Julian","Grace","Levi","Chloe","Isaac","Victoria","Anthony","Riley","Lincoln","Aria","Joshua","Lily","Christopher","Eleanor","Andrew","Hannah","Theodore","Lillian","Samuel","Addison","David","Aubrey","Joseph","Ellie","John","Stella","Ryan","Natalie","Nathan","Zoe","Luke","Leah","Gabriel","Hazel","Oliver","Violet","Daniel","Aurora","Henry","Savannah","Alexander","Audrey","Benjamin","Brooklyn","Matthew","Bella","Eli","Claire","Aidan","Lucy","Jayden","Paisley","Caleb","Everly","Landon","Anna","Connor","Caroline","Brayden","Nova","Jeremiah","Genesis","Evan","Emilia"];
const lastNames  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Phillips","Evans","Turner","Parker","Collins","Edwards","Stewart","Morris","Murphy","Cook","Rogers","Morgan","Peterson","Cooper","Reed","Bailey","Bell","Gomez","Kelly","Howard","Ward","Cox","Diaz","Richardson","Wood","Watson","Brooks","Bennett","Gray","James","Reyes","Cruz","Hughes","Price","Myers","Long","Foster","Sanders","Ross","Morales","Powell","Sullivan","Russell","Ortiz","Jenkins","Gutierrez","Perry"];
const topics = ["travel","tech","food","art","sports","music","health","finance","gaming","science"];
const adjectives = ["amazing","incredible","surprising","beautiful","controversial","exciting","strange","perfect","terrible","underrated"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollDice() {
  return randomInt(1, 6);
}

function makeTitle(i: number) {
  return `Post ${i + 1}: ${pick(adjectives)} ${pick(topics)} story`;
}

function makeContent(i: number) {
  return `Post ${i + 1} about ${pick(topics)}. ${pick(adjectives)} things happened here.`;
}

function makeMedia(i: number) {
  return {
    url: `https://picsum.photos/seed/${i}/800/600`,
    public_id: `seed/post_${i}`,
  };
}

async function seed() {
  await connectDB();

  // ── Clear posts, comments, reactions (keep users) ──────────────────────────
  console.log("Clearing posts, comments, reactions...");
  await Promise.all([
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Reaction.deleteMany({}),
  ]);

  // ── Create seed users (skip existing emails) ───────────────────────────────
  console.log(`Creating up to ${SEED_USER_COUNT} seed users...`);
  const seedEmails = Array.from({ length: SEED_USER_COUNT }, (_, i) => `seeduser${i + 1}@example.com`);
  const existingEmails = new Set(
    (await User.find({ email: { $in: seedEmails } }).select("email")).map((u) => u.email),
  );
  const toInsert = seedEmails
    .filter((email) => !existingEmails.has(email))
    .map((email, i) => ({
      first_name: firstNames[i % firstNames.length],
      last_name: lastNames[i % lastNames.length],
      email,
      password: "Password@123",
      dob: new Date("1995-06-15"),
      email_verified: true,
    }));
  if (toInsert.length) await User.insertMany(toInsert);

  // Fetch ALL users (your existing account + seed users)
  const allUsers = await User.find({}).select("_id");
  const userIds = allUsers.map((u) => u._id as mongoose.Types.ObjectId);
  console.log(`Total users: ${userIds.length}`);

  // ── Posts ──────────────────────────────────────────────────────────────────
  console.log(`Seeding ${TOTAL_POSTS} posts...`);

  const usedReactionKeys = new Set<string>();
  const reactionDocs: any[] = [];

  function addReaction(
    userId: mongoose.Types.ObjectId,
    targetId: mongoose.Types.ObjectId,
    type: ReactableType,
  ) {
    const key = `${userId}:${targetId}:${type}`;
    if (usedReactionKeys.has(key)) return;
    usedReactionKeys.add(key);
    reactionDocs.push({
      user: userId,
      reactableId: targetId,
      reactableType: type,
      value: Math.random() > 0.3 ? ReactionValue.LIKE : ReactionValue.DISLIKE,
    });
  }

  for (let batch = 0; batch < TOTAL_POSTS / POST_BATCH_SIZE; batch++) {
    const postDocs = Array.from({ length: POST_BATCH_SIZE }, (_, j) => {
      const i = batch * POST_BATCH_SIZE + j;
      const dice = rollDice();
      return {
        owner: pick(userIds),
        title: makeTitle(i),
        content: dice === 3 || dice === 2 ? makeContent(i) : undefined,
        media_url: dice === 6 || dice === 2 ? makeMedia(i) : undefined,
      };
    });

    const posts = await Post.insertMany(postDocs);

    for (const post of posts) {
      const postId = post._id as mongoose.Types.ObjectId;

      // Reactions on post
      for (const uid of pickMany(userIds, randomInt(2, 8))) {
        addReaction(uid, postId, ReactableType.POST);
      }

      // Top-level comments
      const topComments = await Comment.insertMany(
        Array.from({ length: COMMENTS_PER_POST }, () => ({
          owner: pick(userIds),
          commentableId: postId,
          commentableType: CommentableType.POST,
          parentComment: null,
          content: `${pick(adjectives)} take on "${post.title}".`,
        })),
      );

      for (const comment of topComments) {
        const commentId = comment._id as mongoose.Types.ObjectId;

        // Reactions on comment
        for (const uid of pickMany(userIds, randomInt(1, 5))) {
          addReaction(uid, commentId, ReactableType.COMMENT);
        }

        // Replies
        const replies = await Comment.insertMany(
          Array.from({ length: REPLIES_PER_COMMENT }, () => ({
            owner: pick(userIds),
            commentableId: commentId,
            commentableType: CommentableType.COMMENT,
            parentComment: commentId,
            content: `${pick(adjectives)} response to this comment.`,
          })),
        );

        for (const reply of replies) {
          for (const uid of pickMany(userIds, randomInt(1, 3))) {
            addReaction(uid, reply._id as mongoose.Types.ObjectId, ReactableType.COMMENT);
          }
        }
      }
    }

    console.log(`Batch ${batch + 1}/${TOTAL_POSTS / POST_BATCH_SIZE} done`);
  }

  await Reaction.insertMany(reactionDocs);

  console.log("\nSeed complete:");
  console.log(`  Users:     ${userIds.length}`);
  console.log(`  Posts:     ${TOTAL_POSTS}`);
  console.log(`  Reactions: ${reactionDocs.length}`);
  console.log("\nSeed user credentials — password: Password@123");
  console.log("  seeduser1@example.com ... seeduser99@example.com");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
