const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const chatSchema = new Schema({
    id:{
        type: String
    },
    chatId:{
        type:String
    },
    sessionId:{
        type:Number
    },
    transType:{
        type:String
    },
    phoneNumber:{
        type: String
    },
    appNumber:{
        type: String
    },
    promo:{
        type:String
    },
    status:{
        type:String
    },
    stage:{
        type:Number
    },
    message:{
        type:String
    },
    fullName:{
        type:String
    },
    age:{
        type:Number
    },
    gender:{
        type:String
    },
    province:{
        type:String
    },
    district:{
        type:String
    },
    ward:{
        type:String
    },
    crop:{
        type:String
    },
    hectrage:{
        type:String
    },
    hops:{
        type:String
    },
    time:{
        type:Number
    },
    created:{
        type:Date,
        default:Date.now
    }
});

const Chat = mongoose.model('chat', chatSchema);

module.exports=Chat;