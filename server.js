
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Student = require("./model/Student");
const User = require("./model/User");
const authenticateToken = require("./middleware/auth");

const app = express();

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
        console.error("MongoDB connection failed:", error.message);
    });

// ==========================
// USER REGISTRATION
// ==========================

app.post("/register", async (req, res) => {

    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            password.length < 8
        ) {
            return res.status(400).json({
                message: "Enter your name, a valid email, and a password of at least 8 characters"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "This email is already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: cleanEmail,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Registration successful. Please login."
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).json({
                message: "This email is already registered"
            });
        }

        console.error("Registration error:", error.message);

        res.status(500).json({
            message: "Error during registration"
        });
    }

});

// ==========================
// USER LOGIN
// ==========================

app.post("/login", async (req, res) => {

    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Please enter email and password"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {

        console.error("Login error:", error.message);

        res.status(500).json({
            message: "Error during login"
        });
    }

});

// ==========================
// PROTECT ALL STUDENT ROUTES
// ==========================

app.use("/students", authenticateToken);

// ==========================
// CREATE STUDENT
// ==========================

app.post("/students", async (req, res) => {

    try {
        const student = new Student(req.body);

        const savedStudent = await student.save();

        res.status(201).json(savedStudent);

    } catch (error) {

        console.error("Create student error:", error.message);

        res.status(400).json({
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

        console.error("Fetch students error:", error.message);

        res.status(500).json({
            message: "Error fetching students"
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

        res.status(400).json({
            message: "Invalid student ID or request"
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

        console.error("Update student error:", error.message);

        res.status(400).json({
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
        const student = await Student.findByIdAndDelete(
            req.params.id
        );

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json({
            message: "Student deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            message: "Invalid student ID or request"
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

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("MONGO_URI and JWT_SECRET must be configured");
    process.exit(1);
}

mongoose.connection.once("open", () => {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
});
