import Comment from "../models/Comment.js";
import Post from "../models/Post.js";

// Add Comment
export const addComment = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId, content } = req.body;

        if (!content || !content.trim()) {
            return res.json({ success: false, message: "Comment content is required" });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.json({ success: false, message: "Post not found" });
        }

        const comment = await Comment.create({
            post: postId,
            user: userId,
            content: content.trim()
        });

        const populatedComment = await Comment.findById(comment._id).populate('user');

        res.json({ success: true, message: "Comment added", comment: populatedComment });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get Comments for a Post
export const getComments = async (req, res) => {
    try {
        const { postId } = req.params;

        const comments = await Comment.find({ post: postId })
            .populate('user')
            .sort({ createdAt: -1 });

        res.json({ success: true, comments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Delete Comment
export const deleteComment = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.json({ success: false, message: "Comment not found" });
        }

        if (comment.user !== userId) {
            return res.json({ success: false, message: "You can only delete your own comments" });
        }

        await Comment.findByIdAndDelete(commentId);

        res.json({ success: true, message: "Comment deleted" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
