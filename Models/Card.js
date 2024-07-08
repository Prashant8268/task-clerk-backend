const mongoose = require('mongoose');

const { Schema } = mongoose;

const cardSchema = new Schema({
    text: { type: String, required: true }
});

const Card = mongoose.models.Card || mongoose.model('Card', cardSchema);

module.exports = Card;
