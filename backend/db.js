const mongoose = require("mongoose");
const { Schema } = require("zod");

mongoose.connect("mongodb+srv://nishidixit:1wOdVW1oJhtsMdGd@cluster0.bnagwrl.mongodb.net/Paytm?retryWrites=true&w=majority");

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30
    },
    password: {
        type: String,
        required: true,
        minLength: 6

    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    }
})

const accountSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    balance:{
        type: Number,
        required: true
    }

})

const User = mongoose.model('User',userSchema);
const Account  = mongoose.model('Account',accountSchema);

module.exports = {
    User,
    Account
}

