const mongoose = require('mongoose');
var Int32 = require('mongoose-int32');
var ObjectId = mongoose.Schema.Types.ObjectId;
const PreviousStagesSchema = mongoose.Schema({

    stage:{
        type: String
    },
    phoneNumber:{
        type:String,
        index: true
    },
    created:{
        type:Date,
        default:Date.now,
        required:true
    },
    name: String,
    msg: String,
    details : [ {
        option : Int32,
        contentId : ObjectId,
        title: String
      }
    ]

});

module.exports = mongoose.model('previousstages', PreviousStagesSchema);