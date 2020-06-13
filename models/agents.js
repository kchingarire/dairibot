const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const AgentsSchema = Schema({

    id: String,
    phoneNumber:{
        type: String
    },
    name:{
        type:String
    },
    chatId: {
        type:String
    }

});

module.exports = mongoose.model('agents', AgentsSchema);
