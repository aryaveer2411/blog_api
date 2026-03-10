import { asyncHandler } from "../utils/async_handler";

const createPost =  asyncHandler(async (req, res) => { });
const editPost =  asyncHandler(async (req, res) => { });
const deletePost =  asyncHandler(async (req, res) => { });


const getPost = asyncHandler(async (req, res) => {
    // get post by user id
    // will handle both with post id and if no id then return all post
    // wil handle search
    // will handle sort
    // add pagination
});

export{ createPost,editPost,deletePost,getPost}
