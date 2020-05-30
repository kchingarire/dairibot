const mongoose = require('mongoose');

const MessageSchema = mongoose.Schema({

    id: String,
    text:{
        type: String
    },
    body:{
        type: String
    },
    type:{
        type:String
    },
    senderName:{
        type: String,
        default:''
    },
    fromMe:{
        type:Boolean
    },
    user:{
        type:String
    },
    author:{
        type:String
    },
    time:{
        type:Number
    },
    chatId:{
        type:String
    },
    messageNumber:{
        type:Number
    },
    created:{
        type:Date,
        default:Date.now
    }

});

module.exports = mongoose.model('message', MessageSchema);