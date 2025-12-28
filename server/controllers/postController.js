import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";

// Add Post
export const addPost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { content, post_type } = req.body;
        const images = req.files

        let image_urls = []

        if(images.length){
            image_urls = await Promise.all(
                images.map(async (image) => {
                    const fileBuffer = fs.readFileSync(image.path)
                     const response = await imagekit.upload({
                            file: fileBuffer,
                            fileName: image.originalname,
                            folder: "posts",
                        })

                        const url = imagekit.url({
                            path: response.filePath,
                            transformation: [
                                {quality: 'auto'},
                                { format: 'webp' },
                                { width: '1280' }
                            ]
                        })
                        return url
                })
            )
        }

        await Post.create({
            user: userId,
            content,
            image_urls,
            post_type
        })
        res.json({ success: true, message: "Post created successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get Posts
export const getFeedPosts = async (req, res) =>{
    try {
        const { userId } = req.auth()
        const user = await User.findById(userId)

        // User connections and followings
        const userIds = [userId, ...user.connections, ...user.following]
        const posts = await Post.find({user: {$in: userIds}})
            .populate('user')
            .populate({
                path: 'original_post',
                populate: { path: 'user' }
            })
            .sort({createdAt: -1});

        // Get comments count for each post
        const postsWithCounts = await Promise.all(posts.map(async (post) => {
            const commentsCount = await Comment.countDocuments({ post: post._id });
            return {
                ...post.toObject(),
                comments_count: commentsCount
            };
        }));

        res.json({ success: true, posts: postsWithCounts })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Like Post
export const likePost = async (req, res) =>{
    try {
        const { userId } = req.auth()
        const { postId } = req.body;

        const post = await Post.findById(postId)

        if(post.likes_count.includes(userId)){
            post.likes_count = post.likes_count.filter(user => user !== userId)
            await post.save()
            res.json({ success: true, message: 'Post unliked' });
        }else{
            post.likes_count.push(userId)
            await post.save()
            res.json({ success: true, message: 'Post liked' });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Repost
export const repostPost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId } = req.body;

        const originalPost = await Post.findById(postId);
        if (!originalPost) {
            return res.json({ success: false, message: "Post not found" });
        }

        // Check if user already reposted this post
        const existingRepost = await Post.findOne({
            user: userId,
            original_post: postId
        });

        if (existingRepost) {
            return res.json({ success: false, message: "You have already shared this post" });
        }

        // Create repost
        await Post.create({
            user: userId,
            post_type: 'repost',
            original_post: postId
        });

        // Increment shares_count on original post
        originalPost.shares_count = (originalPost.shares_count || 0) + 1;
        await originalPost.save();

        res.json({ success: true, message: "Post shared successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}