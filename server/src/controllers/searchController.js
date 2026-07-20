import pool from "../config/db.js";
export const searchPosts = async (req,res)=>{
    try{

        const { q } = req.query;

        const result = await pool.query(
            `
            SELECT *
            FROM posts
            WHERE title ILIKE $1
               OR content ILIKE $1
            ORDER BY created_at DESC
            `,
            [`%${q}%`]
        );

        res.json({
            success:true,
            posts:result.rows
        });

    }catch(error){

        console.error(error);

        res.status(500).json({
            success:false,
            message:"Internal server error."
        });

    }
};

export const searchUsers = async (req,res)=>{
    try{

        const { q } = req.query;

        const result = await pool.query(
            `
            SELECT
                id,
                username,
                bio,
                profile_image
            FROM users
            WHERE username ILIKE $1
            `,
            [`%${q}%`]
        );

        res.json({
            success:true,
            users:result.rows
        });

    }catch(error){

        console.error(error);

        res.status(500).json({
            success:false,
            message:"Internal server error."
        });

    }
};

export const searchCommunities = async (req,res)=>{
    try{

        const { q } = req.query;

        const result = await pool.query(
            `
            SELECT
                id,
                name,
                slug,
                description,
                member_count
            FROM communities
            WHERE name ILIKE $1
            `,
            [`%${q}%`]
        );

        res.json({
            success:true,
            communities:result.rows
        });

    }catch(error){

        console.error(error);

        res.status(500).json({
            success:false,
            message:"Internal server error."
        });

    }
};