const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const ContentsSchema = Schema({

    id: String,
    title: String,
    content:{
        content_type: String
    },
    keywords: Array,
    image:String
});
ContentsSchema.index({
    title: 'text',
    content: 'text',
    keywords: 'text'
  }, {
    weights: {
      title: 5,
      content: 1
    },
  });

module.exports = mongoose.model('contents', ContentsSchema);
