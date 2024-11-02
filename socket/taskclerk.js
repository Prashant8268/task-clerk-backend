const Task = require("../Models/Task");
const Workspace = require("../Models/Workspace");
const Card = require("../Models/Card");

const initSocket = (io) => {
  const taskNamespace = io.of("/tasks");
  taskNamespace.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });

    // Task event listeners
    socket.on("editTask", async ({ id: taskId, name: newName }) => {
      try {
        const updatedTask = await Task.findByIdAndUpdate(
          taskId,
          { name: newName },
          { new: true }
        ).populate("cards");
        socket.emit("taskUpdated", updatedTask);
      } catch (error) {
        console.error("Error editing task:", error);
      }
    });

    socket.on(
      "editTaskDescription",
      async ({ id: taskId, description: newDescription }) => {
        try {
          const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { description: newDescription },
            { new: true }
          ).populate("cards");
          if (updatedTask) socket.emit("taskUpdated", updatedTask);
        } catch (error) {
          console.error("Error editing task:", error);
        }
      }
    );

    socket.on(
      "editTaskDeadline",
      async ({ id: taskId, deadline: newDeadline }) => {
        try {
          const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { deadline: newDeadline },
            { new: true }
          );
          socket.emit("taskUpdated", updatedTask);
        } catch (error) {
          console.error("Error editing task deadline:", error);
        }
      }
    );

    socket.on("deleteTask", async ({ id: taskId }) => {
      try {
        const task = await Task.findById(taskId);
        if (!task) return;

        await Task.findByIdAndDelete(task._id);
        await Workspace.findByIdAndUpdate(task.workspaceId, {
          $pull: { tasks: task._id },
        });

        socket.emit("taskDeleted", taskId);
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    });

    socket.on("addTask", async (newTask) => {
      try {
        const task = new Task(newTask);
        const savedTask = await task.save();
        const workspace = await Workspace.findById(newTask.workspaceId);
        workspace.tasks.push(savedTask);
        await workspace.save();

        socket.emit("taskAdded", savedTask);
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
        await task.save();

        // Retrieve the updated task with populated cards
        const updatedTask = await Task.findById(taskId).populate("cards");

        socket.emit("taskUpdated", updatedTask);
      } catch (error) {
        console.error("Error adding card:", error);
      }
    });

    socket.on("deleteCard", async ({ taskId, cardId }) => {
      try {
        const task = await Task.findById(taskId);
        if (!task) return;

        // Filter out the card to be deleted
        task.cards = task.cards.filter((card) => card.toString() !== cardId);

        // Save the updated task
        await task.save();
        const updatedTask = await Task.findById(taskId).populate("cards");
        await Card.findByIdAndDelete(cardId);
        socket.emit("taskUpdated", updatedTask);
      } catch (error) {
        console.error("Error deleting card:", error);
      }
    });

    socket.on("deleteWorkspace", ({ workspaceId }) => {
      socket.emit("workspaceDeleted", { workspaceId });
    });
  });
};

module.exports = initSocket;
