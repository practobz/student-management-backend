const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Student = require("./model/Student");

const app = express();


// ==========================
// MIDDLEWARE
// ==========================

app.use(cors());
app.use(express.json());


// ==========================
// MONGODB CONNECTION
// ==========================

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error);
    });


// ==========================
// CREATE STUDENT
// ==========================

app.post("/students", async (req, res) => {

    try {

        const student = new Student(req.body);

        const savedStudent = await student.save();

        res.status(201).json(savedStudent);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error adding student",
            error: error.message
        });

    }

});


// ==========================
// GET ALL STUDENTS
// ==========================

app.get("/students", async (req, res) => {

    try {

        const students = await Student.find();

        res.json(students);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error fetching students",
            error: error.message
        });

    }

});


// ==========================
// GET ONE STUDENT
// ==========================

app.get("/students/:id", async (req, res) => {

    try {

        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json(student);

    } catch (error) {

        res.status(500).json({
            message: "Error fetching student",
            error: error.message
        });

    }

});


// ==========================
// UPDATE STUDENT
// ==========================

app.put("/students/:id", async (req, res) => {

    try {

        const student = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json(student);

    } catch (error) {

        res.status(500).json({
            message: "Error updating student",
            error: error.message
        });

    }

});


// ==========================
// DELETE STUDENT
// ==========================

app.delete("/students/:id", async (req, res) => {

    try {

        const student = await Student.findByIdAndDelete(req.params.id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json({
            message: "Student deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            message: "Error deleting student",
            error: error.message
        });

    }

});


// ==========================
// HOME
// ==========================

app.get("/", (req, res) => {

    res.send("Student Management API is running");

});


// ==========================
// START SERVER
// ==========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(`Server running on port ${PORT}`);

});
