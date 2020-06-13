const mongoose = require('mongoose');
var Int32 = require('mongoose-int32');

const MenuSchema = mongoose.Schema({

    id: String,
    stage:{
        type: String
    },
    itemName:{
        type: String
    },
    stage_type: String,
    parent:{
        type: String
    },
    option:{
        type: Int32
    }
});

MenuSchema.index({
    itemName: 'text',
  });

module.exports = mongoose.model('menus', MenuSchema);