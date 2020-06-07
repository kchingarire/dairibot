const mongoose = require('mongoose');
var Int32 = require('mongoose-int32');
var ObjectId = mongoose.Schema.Types.ObjectId;
const StagesSchema = mongoose.Schema({

    _id: String,
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
    stage_type:{
        type:String
    },
    name: String,
    details : [ {
        option : Int32,
        contentId : ObjectId,
        title: String
      }
    ]

});

module.exports = mongoose.model('stages', StagesSchema);