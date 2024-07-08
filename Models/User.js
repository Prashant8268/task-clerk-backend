const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    workspaces: [{ type: Schema.Types.ObjectId, ref: 'Workspace' }]
}, {
    timestamps: true
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
