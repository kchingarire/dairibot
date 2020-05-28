const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const ContactsSchema = Schema({

    id: String,
    phoneNumber:{
        type: String
    },
    name:{
        type:String
    }

});

module.exports = mongoose.model('contacts', ContactsSchema);
