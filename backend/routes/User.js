const express = require("express");
const { User, Account } = require("../db");
const zod = require("zod");
const { jwt } = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { authMiddleware } = require("../middleware");
const router = express.Router();

const signUpBody = zod.object({
    username: zod.string().email(),
    firstName: zod.string(),
    lastName: zod.string(),
    password: zod.string()
})

const signInBody = zod.object({
    username: zod.string().email(),
    password: zod.string()
})

const updateUserBody = zod.object({
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
    password: zod.string().optional()
})


router.post("/signup", async (req,res) => {
    const success = signUpBody.safeParse(req);
    if(!success){
        return res.status(411).json({
            message: "Incorrect input body"
        })
    }

    const isExistingUser = await User.findOne({
        username: req.body.username
    })

    if(isExistingUser){
        return res.status(411).json({
            message: "Email already associated to an user"
        })
    }

    const newUser = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    })

    const userId = newUser._id;

    await Account.create({
        userId: userId,
        balance: 0
    })

    const tokenJwt = jwt.sign({
        userId
    },JWT_SECRET)

    res.status(201).json({
        message:"User Created Successfully",
        token: tokenJwt
    })

})


router.post("/signin", async (req,res)=>{
    const isBodyValid = signInBody.safeParse(req);
    if(!isBodyValid){
        return res.status(411).json({
            message: "Request body is invalid or does not contain the required attributes"
        })
    }

    const user = await User.findOne({
        username: req.body.username,
        password: req.body.password
    })
    const userId = user._id;

    const tokenJwt = jwt.sign({
        userId,
    },JWT_SECRET)

    if(user){
        return res.status(200).json({
            message: "User logged in successfully",
            token: tokenJwt
        })
    }

    return res.status(411).json({
        message:"Something went wrong please try again later"
    })
})

router.put("/", authMiddleware, async (req,res)=>{
    const success = updateUserBody.safeParse(req.body);
    if(!success){
        return res.status(411).json({
            message: "Invalid input"
        })
    }

    await User.updateOne({_id: req.userId},req.body)
    res.status(200).json({
        message: "Detail updated successfully"
    })
})

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})


module.exports = router;