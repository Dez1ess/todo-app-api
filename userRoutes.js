const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

//TodoModel
const todoSchema = new mongoose.Schema(
  {
    id: String,
    title: String,
    completed: Boolean,
    userId: String,
  },
  { versionKey: false }
);

const Todo = mongoose.model("todos", todoSchema);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

router.get("/tasks/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const todos = await Todo.find({userId})

    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
})

router.post("/tasks", async (req, res) => {
  try {
    const task = await new Todo({
      id: req.body.id,
      title: req.body.title,
      completed: false,
      userId: req.body.userId,
    });
    await task.save();
    res.status(201).json({ id: req.body.id });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/tasks/:userId/:id", async (req, res) => {
  try {
    await Todo.deleteOne({ userId: req.params.userId, id: req.params.id });

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/tasks/:userId/:id", async (req, res) => {
  try {
    const task = await Todo.findOne({ userId: req.params.userId, id: req.params.id });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Toggle the completion status
    task.completed = !task.completed;
    
    await task.save();

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;