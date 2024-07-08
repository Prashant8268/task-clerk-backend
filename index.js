const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Task = require('./Models/Task'); // Assuming you have a Task model
const Workspace = require('./Models/Workspace')

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"]
  }
});

const PORT = process.env.PORT || 3001;
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});

app.use(cors({
  origin: "*"
}));

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('editTask', async ({ id: taskId, name: newName }) => {
    try {
      const updatedTask = await Task.findByIdAndUpdate(taskId, { name: newName }, { new: true });
      await updatedTask.populate({path: 'cards', model: 'Card'});
      io.emit('taskUpdated', updatedTask);
    } catch (error) {
      console.error('Error editing task:', error);
    }
  });

  socket.on('editTaskDescription',async ({id: taskId , description: newDescription})=>{
    try{
      const updatedTask = await Task.findByIdAndUpdate(taskId, { description:newDescription }, { new: true });
      if (!updatedTask) {
          throw new Error('Task not found');
      }
      await updatedTask.populate({path:'cards',model:'Card'});
      io.emit('taskDescriptionUpdated', updatedTask)
    }catch(err){
      console.error('Error editing task:', err);
    }
  })

  socket.on('editTaskDeadline', async ({ taskId, newDeadline }) => {
    try {
      const updatedTask = await Task.findByIdAndUpdate(taskId, { deadline: newDeadline }, { new: true });
      io.emit('taskUpdated', updatedTask);
    } catch (error) {
      console.error('Error editing task deadline:', error);
    }
  });

  socket.on('deleteTask', async ({id:taskId}) => {
    try {
      const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    const workspaceId = task.workspaceId;
    await Task.findByIdAndDelete(task._id);
    await Workspace.findByIdAndUpdate(workspaceId, {
      $pull: { tasks: task._id }
    });

    io.emit('taskDeleted', taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  });

  socket.on('addTask', async (newTask) => {
    try {
      let task = new Task(newTask);
      // task.deadline = task.deadline.toISOString().split('T')[0]
      const savedTask = await task.save();
      await savedTask.save();;
      const workspace = await Workspace.findById(newTask.workspaceId);
      workspace.tasks.push(savedTask);
      await workspace.save()
      io.emit('taskAdded', savedTask);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  });

  socket.on('addCard', async ({ taskId, card }) => {
    try {
      const task = await Task.findById(taskId);
      task.cards.push(card);
      const updatedTask = await task.save();
      io.emit('taskUpdated', updatedTask);
    } catch (error) {
      console.error('Error adding card:', error);
    }
  });

  socket.on('deleteCard', async ({ taskId, cardIndex }) => {
    try {
      const task = await Task.findById(taskId);
      task.cards.splice(cardIndex, 1);
      const updatedTask = await task.save();
      io.emit('taskUpdated', updatedTask);
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  });
});

// Express routes (if needed)
app.get('/', (req, res) => {
  res.send('Socket.io server is running');
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
