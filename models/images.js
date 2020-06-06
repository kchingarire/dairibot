const mongoose = require('mongoose');
var Int32 = require('mongoose-int32');

const ImageSchema = mongoose.Schema({

    id: String,
    name:{
        type: String
    },
    base64:{
        type: String
    },
    url:{
        type: String
    }
});

ImageSchema.index({
    itemName: 'name',
  });

module.exports = mongoose.model('images', ImageSchema);