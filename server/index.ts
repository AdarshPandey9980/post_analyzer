import express, { Request, Response } from "express";
import cors from "cors";
import genRandom from "./utils/random";
import { runAIWorkFlow } from "./workflow/langflow";
import dotenv from "dotenv";
import dbConnect, { collection } from "./db/db-connect";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

dbConnect();

app.use(cors());
app.use(express.json());

// for generating demo-posts
app.get("/demo-posts", (req: Request, res: Response) => {
  const userId = req.query.userid;
  // const number = req.query.noOfPost;

  console.log(userId);
  

  const numberOfPosts: number = parseInt(req.query.n as string) || 10;

  const POST_TYPES = ["reel", "static image", "carousel"];

  const posts = [];

  for (let i = 0; i < numberOfPosts; i++) {
    posts.push({
      user_id: userId,
      post_type: POST_TYPES[genRandom(0, 3)],
      likes: genRandom(30, 500),
      comments: genRandom(30, 1000),
      shares: genRandom(10, 600),
    });
  }

  res.status(200).json({ posts });
});

// for putting the data's to the db
app.post("/put-posts", async (req: Request, res: Response) => {
  const posts: {
    user_id: string;
    post_type: string;
    likes: number;
    comments: number;
    shares: number;
  }[] = req.body.posts;

  try {
    console.log(posts);
    const response = await collection.insertMany(posts);
    console.log(response);
    res
      .status(200)
      .json({ response });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Server problem in putting the posts" });
  }
});

// for putting demo posts
app.get("/analyse-posts", async (req: Request, res: Response) => {
  const userId: string = req.query.userid as string;
  console.log(userId);

  const response = await runAIWorkFlow(`Analyze the following dataset about user with user id ${userId} posts and provide insights based on average likes, comments, and shares for each post_type. The insights should follow this structure:

    State the average likes, comments, and shares for reel posts in the format:
    'Reels drive X avg likes, Y avg comments, and Z avg shares.'
    
    Mention if a post_type was not posted at all, for example:
    'No carousels posted' or 'No static image posted.'
    
    NOTE:- please provide the output in the mention structure only do not generate any this else
    `);

  res.status(200).json({ response });
});

app.listen(PORT, () => {
  console.log("Server is listening in the port " + PORT);
});
