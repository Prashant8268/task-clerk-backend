const mongoose = require('mongoose');
const Card = require('./Card');
const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date },
  priority: { type: String, default: 'low' },
  status: { type: String, default: 'pending' },
  cards: [{ type: mongoose.Schema.Types.ObjectId , ref:'Card'}],
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Workspace' },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
