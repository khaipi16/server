const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const BlogSchema = new Schema({
    title: String,
    author: String,
    image: String,
    date: String,
    content: String,
    user: {type:Schema.Types.ObjectId, ref:'User'}
}, {
    timestamps: true
});

const BlogModel = model('Blog', BlogSchema);

export default BlogModel;