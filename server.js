const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const db = require("./db");
require("dotenv").config();

const app = express();

app.use(express.static("public"));
app.use(express.static("views"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use((req, res, next) => {
    console.log(`➡️ Incoming request: ${req.method} ${req.url}`);
    next();
});

app.use(
    session({
        secret: "supersecret",
        resave: false,
        saveUninitialized: true,
    })
);

// 🟢 Home Page
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

// 🔑 User Registration
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing username or password." });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, message: "Password too short." });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await db.query(
            "INSERT INTO user_info (username, password) VALUES ($1, $2) RETURNING *",  // ✅ Fix: RETURNING * to get result
            [username, hash]
        );

        console.log("✅ New user registered:", result.rows[0]); // ✅ Now this will work
        res.json({ success: true, message: "Registration successful!" });
    } catch (err) {
        console.error("❌ Registration Error:", err);
        res.status(400).json({ success: false, message: "Username already exists." });
    }
});

// 🔓 User Login
app.post("/login", async (req, res) => {
    console.log("🔹 Login Request Received:", req.body);

    const { username, password } = req.body;

    if (!username || !password) {
        console.log("❌ Missing username or password");
        return res.status(400).json({ success: false, message: "Missing username or password." });
    }

    try {
        const result = await db.query("SELECT * FROM user_info WHERE username = $1", [username]);
        
        if (result.rows.length === 0) {
            console.log("❌ User not found:", username);
            return res.status(401).json({ success: false, message: "User not found." });
        }

        const user = result.rows[0];
        console.log("🔍 User Found:", user);

        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            console.log("❌ Incorrect password for:", username);
            return res.status(401).json({ success: false, message: "Incorrect password." });
        }

        req.session.user = { id: user.id, username: user.username };
        console.log("✅ User logged in:", req.session.user);

        res.json({ success: true, message: "Login successful!" });

    } catch (err) {
        console.error("❌ Login Error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 🏆 Get Leaderboard
app.get("/leaderboard", async (req, res) => {
    try {
        console.log("🔹 Fetching leaderboard...");
        const regular = await db.query(
            "SELECT username, regular_score FROM user_info ORDER BY regular_score DESC LIMIT 10"
        );
        const timed = await db.query(
            "SELECT username, timed_score FROM user_info ORDER BY timed_score DESC LIMIT 10"
        );

        console.log("✅ Leaderboard Data Retrieved!");
        res.json({
            regular: regular.rows,
            timed: timed.rows
        });

    } catch (err) {
        console.error("❌ Leaderboard Error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 🎮 Update Score
app.post("/update_score", async (req, res) => {
    if (!req.session.user) {
        console.log("❌ Unauthorized score update attempt.");
        return res.status(403).json({ success: false, message: "Not logged in" });
    }

    const { mode, score } = req.body;
    const column = mode === "regular" ? "regular_score" : "timed_score";

    try {
        console.log(`🔹 Updating score for ${req.session.user.username} in mode: ${mode}`);
        await db.query(
            `UPDATE user_info SET ${column} = GREATEST(${column}, $1) WHERE id = $2`,
            [score, req.session.user.id]
        );
        console.log("✅ Score updated!");
        res.json({ success: true, message: "Score updated!" });

    } catch (err) {
        console.error("❌ Score Update Error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 🎨 Save Customization
app.post("/customization", async (req, res) => {
    if (!req.session.user) {
        console.log("❌ Unauthorized customization attempt.");
        return res.status(403).json({ success: false, message: "Not logged in" });
    }

    const { snake_color, map_color } = req.body;

    try {
        console.log(`🔹 Updating customization for ${req.session.user.username}`);
        await db.query(
            "UPDATE user_info SET snake_color = $1, map_color = $2 WHERE id = $3",
            [snake_color, map_color, req.session.user.id]
        );
        console.log("✅ Customization saved!");
        res.json({ success: true, message: "Customization saved!" });

    } catch (err) {
        console.error("❌ Customization Error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

app.get("/get_customization", async (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, message: "No user logged in." });
    }

    try {
        const result = await db.query(
            "SELECT snake_color, map_color FROM user_info WHERE id = $1",
            [req.session.user.id]
        );

        if (result.rows.length === 0) {
            return res.json({ success: false, message: "No customizations found." });
        }

        res.json({ success: true, snake_color: result.rows[0].snake_color, map_color: result.rows[0].map_color });
    } catch (err) {
        console.error("❌ Error fetching customizations:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));