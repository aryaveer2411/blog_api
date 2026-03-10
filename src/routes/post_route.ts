import { Router } from "express";
import { createPost, deletePost, editPost, getPost } from "../controllers/post_controller";


export const postRouter = Router();

postRouter.route("/create").post(createPost);
postRouter.route("/edit").put(editPost);
postRouter.route("/delete").delete(deletePost);
postRouter.route("/post").get(getPost);
