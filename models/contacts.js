const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const ContactsSchema = Schema({

    id: String,
    phoneNumber:{
        type: String
    },
    name:{
        type:String
    },
    chatId:{
        type:String
    },
    senderName:{
        type:String
    },
    complaints : [ {
        messageId : String,
        text: String,
        forwarded: Boolean,
        created:{
            type:Date,
            default:Date.now,
            required:true
        },
      }
    ],
    orders : [ {
        messageId : String,
        text: String,
        forwarded: Boolean,
        created:{
            type:Date,
            default:Date.now,
            required:true
        },
      }
    ]

});

module.exports = mongoose.model('contacts', ContactsSchema);
