const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Task = require("./Models/Task");
const Workspace = require("./Models/Workspace");
const Card = require("./Models/Card");
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"],
  },
});

const PORT = process.env.PORT || 3001;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

app.use(
  cors({
    origin: "*",
  })
);

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
  // working
  socket.on("editTask", async ({ id: taskId, name: newName }) => {
    try {
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { name: newName },
        { new: true }
      );
      await updatedTask.populate({ path: "cards", model: "Card" });
      io.emit("taskUpdated", updatedTask);
    } catch (error) {
      console.error("Error editing task:", error);
    }
  });
  // working
  socket.on(
    "editTaskDescription",
    async ({ id: taskId, description: newDescription }) => {
      try {
        const updatedTask = await Task.findByIdAndUpdate(
          taskId,
          { description: newDescription },
          { new: true }
        );
        if (!updatedTask) {
          throw new Error("Task not found");
        }
        await updatedTask.populate({ path: "cards", model: "Card" });
        io.emit("taskUpdated", updatedTask);
      } catch (err) {
        console.error("Error editing task:", err);
      }
    }
  );
  // working
  socket.on(
    "editTaskDeadline",
    async ({ id: taskId, deadline: newDeadline }) => {
      try {
        const updatedTask = await Task.findByIdAndUpdate(
          taskId,
          { deadline: newDeadline },
          { new: true }
        );
        io.emit("taskUpdated", updatedTask);
      } catch (error) {
        console.error("Error editing task deadline:", error);
      }
    }
  );
  // working
  socket.on("deleteTask", async ({ id: taskId }) => {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error("Task not found");
      }
      const workspaceId = task.workspaceId;
      await Task.findByIdAndDelete(task._id);
      await Workspace.findByIdAndUpdate(workspaceId, {
        $pull: { tasks: task._id },
      });

      io.emit("taskDeleted", taskId);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  });

  // working
  socket.on("addTask", async (newTask) => {
    try {
      let task = new Task(newTask);
      const savedTask = await task.save();
      await savedTask.save();
      const workspace = await Workspace.findById(newTask.workspaceId);
      workspace.tasks.push(savedTask);
      await workspace.save();
      io.emit("taskAdded", savedTask);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  });

  socket.on("addCard", async ({ taskId, newCardText }) => {
    try {
      const task = await Task.findById(taskId);
      const newCard = new Card({ text: newCardText });
      await newCard.save();
      task.cards.push(newCard._id);
      const updatedTask = await task.save();
      await updatedTask.populate({ path: "cards", model: "Card" });
      io.emit("taskUpdated", updatedTask);
    } catch (error) {
      console.error("Error adding card:", error);
    }
  });

  socket.on("deleteCard", async ({ taskId, cardId }) => {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        console.error("Task not found");
        return;
      }
      const cardIndex = task.cards.indexOf(cardId);
      if (cardIndex === -1) {
        console.error("Card not found in task");
        return;
      }
      task.cards.splice(cardIndex, 1);
      const updatedTask = await task.save();
      await Card.findByIdAndDelete(cardId);

      await updatedTask.populate({ path: "cards", model: "Card" });
      io.emit("taskUpdated", updatedTask);
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  });

  socket.on("deleteWorkspace", ({ workspaceId }) => {
    io.emit("workspaceDeleted", { workspaceId });
  });
});

const indexRoute = require("./Routes/index.js");
app.use("/", indexRoute);

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
