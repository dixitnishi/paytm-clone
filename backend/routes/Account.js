const express = require("express");
const { authMiddleware } = require("../middleware");
const { default: mongoose } = require("mongoose");
const { Account } = require("../db");
const router = express.Router();
const zod  = require("zod")

const transferMoneyRequest = zod.object({
    to: zod.string(),
    amount: zod.number()
})

const addMoneyRequest = zod.object({
    amount: zod.number()
})

router.get("/balance",authMiddleware,async (req,res)=>{
    const account = await Account.findOne({
        userId: req.userId
    })
    res.status(200).json({
        balance: account.balance
    })
})

router.post("/transfer",authMiddleware, async (req,res)=>{
    const isRequestValid = transferMoneyRequest.safeParse(req.body);
    if(!isRequestValid){
        return res.status(400).json({
            message: "Invalid input please enter a valid input"
        })
    } 
    const session = await mongoose.startSession();
    session.startTransaction();
    const {amount,to} = req.body;

    const account = await Account.findOne({
        userId: to
    }).session(session);

    if(!account){
        await session.abortTransaction();
        res.status(400).json({
            message: "Invalid Account"
        })
    }

    const {balance} = await Account.findOne({
        userId: req.userId
    }).session(session);

    if(!balance || balance < amount){
        await session.abortTransaction();
        return res.status(400).json({
            message:"Insufficient Balance"
        })
    }

    await Account.updateOne({ userId: req.userId },{ $inc : {balance: -amount} }).session(session);
    await Account.updateOne({ userId: to },{ $inc : {balance: amount} }).session(session);

    await session.commitTransaction()

    return res.status(200).json({
        message: "Transfer successfull"
    })    
})

router.post("/add-amount",authMiddleware,async (req,res)=>{
    const validBody = addMoneyRequest.safeParse(req.body);
    if(!validBody){
        return res.status(400).json({
            message: "Invalid Request"
        })
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    const {amount} = req.body;
    await Account.updateOne({userId:req.userId},{$inc: {balance: amount}}).session(session)
    await session.commitTransaction();
    
    return res.status(200).json({
        message: "Money added to account successfully"
    })
})
module.exports = router;    