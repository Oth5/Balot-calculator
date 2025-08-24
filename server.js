import express from "express";
import mysql from "mysql2";
import bodyParser from "body-parser";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { verifyToken } from "./verifyToken.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.redirect("/login.html");
});

app.use(express.static("./public"));

const JWT_SECRET = process.env.JWT_SECRET;

const port = process.env.PORT || 3000;
let con;

function connectWithRetry(attempt = 1) {
  con = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: Number(process.env.MYSQLPORT),
  });

  con.connect((err) => {
    if (err) {
      console.error(
        `❌ MySQL connect error [attempt ${attempt}]:`,
        err.code,
        err.message
      );
      if (attempt < 10)
        return setTimeout(() => connectWithRetry(attempt + 1), 2000);
      return process.exit(1);
    }
    console.log("✅ Connected to MySQL");
  });

  con.on("error", (err) => {
    console.error("MySQL error:", err.code, err.message);
    if (
      ["PROTOCOL_CONNECTION_LOST", "ECONNRESET", "ECONNREFUSED"].includes(
        err.code
      )
    ) {
      connectWithRetry();
    } else {
      throw err;
    }
  });
}

connectWithRetry();

console.log("DB CONFIG =>", {
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD ? "***" : "MISSING",
  database: process.env.MYSQLDATABASE,
});

app.get("/", (req, res) => {
  res.send("✅ Balot Calculator API is running!");
});

/* ✅ مسار فحص الصحة */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/me", verifyToken, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    role: req.user.role,
  });
});

//auth register signup
app.post("/register", async (req, res) => {
  try{
  let { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

    username = username.trim();

con.query("SELECT id FROM users WHERE username=? LIMIT 1",[username],async(err,result)=>{

    if (err) {
          console.error("❌ Select user error:", err);
          return res.status(500).json({ error: err.code });
        }
        if (result.length) {
          return res.status(409).json({ error: "اسم المستخدم موجود مسبقا" });
        };
let hash;
 try{
     hash = await bcrypt.hash(password, 10);
 }catch(e){
        console.error("❌ Hashing error:", e.message);
        return res.status(500).json({ error: "Hashing failed", message: e.message });
 }
    con.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hash],
      (err, result) => {
        if (err) {
          console.error("❌ Insert user error:", err.code, err.sqlMessage);
          return res
            .status(500)
            .json({ error: err.code, message: err.sqlMessage });
        }
        res.status(201).json({
          message: "✅ User registered successfully",
          id: result.insertId,
          username,
          role: "user",
        });
      }
    );
    });
  } catch (err) {
    console.error("❌ Hashing error:", err.message);
    res.status(500).json({ error: "Hashing failed", message: err.message });
  }
});

//login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  con.query(
    "SELECT id, username, password, role FROM users WHERE username = ?",
    [username],
    async (err, rows) => {
      if (err)
        return res
          .status(500)
          .json({ error: err.code, message: err.sqlMessage });
      if (!rows.length)
        return res.status(401).json({ error: "Invalid username or password" });

      const user = rows[0];

      try {
        const match = await bcrypt.compare(password, user.password || "");
        if (!match) {
          return res
            .status(401)
            .json({ error: "Invalid username or password" });
        }

        const payload = {
          id: user.id,
          username: user.username,
          role: user.role,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30m" });

        return res.json({
          message: `✅ Login successful (${user.role})`,
          token,
          user: {
            //payload
            id: user.id,
            username: user.username,
            role: user.role,
          },
        });
      } catch (e) {
        console.error("❌ Password comparison error:", e.message);
        return res.status(500).json({ error: "COMPARE_FAILED" });
      }
    }
  );
});

//get all users
app.get("/users", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  con.query("SELECT * FROM users", (err, result) => {
    if (err) {
      console.error("❌ Select error:", err.code, err.message);
      return res.status(500).json({ error: err.code, message: err.sqlMessage });
    }
    res.json(result);
  });
});

//get specific user
app.get("/users/:id", verifyToken, (req, res) => {
  const userID = Number(req.params.id);
  const id = Number(req.user.sub || req.user.id);
  if (userID !== id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  con.query("SELECT * FROM users WHERE id=?", [userID], (err, result) => {
    if (err) {
      console.error("❌ Select error:", err.code, err.message);
      return res.status(500).json({ error: err.code, message: err.sqlMessage });
    }
    return res.json(result[0]);
  });
});

//insert new user
app.post("/users", (req, res) => {
  const username = req.body.username;
  con.query(
    "INSERT INTO users (username) VALUES (?)",
    [username],
    (err, result) => {
      if (err) {
        console.error("❌ Insert user error:", err.code, err.sqlMessage);
        return res
          .status(500)
          .json({ error: err.code, message: err.sqlMessage });
      }
      return res.json({ id: result.insertId, username });
    }
  );
});

app.delete("/users/:id", verifyToken, (req, res) => {
  const ID = Number(req.params.id);
  const authId = Number(req.user.sub || req.user.id);
  const isAdmin = req.user.role === "admin";

  if (authId !== ID && !isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  con.query("DELETE FROM users WHERE id=?", [ID], (err, result) => {
    if (err) {
      console.error("❌ Delete error:", err.code);
      return res.status(500).json({ error: err.code });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "✅ Delete successful" });
  });
});

//get all games
app.get("/games", (req, res) => {
  con.query("SELECT * FROM games ORDER BY id DESC ", (err, result) => {
    if (err) {
      console.error("❌ Select error:", err.code, err.message);
      return res.status(500).json({ error: err.code });
    }
    return res.json(result);
  });
});

//get specific game
app.get("/games/:id", (req, res) => {
  const gameID = req.params.id;

  con.query("SELECT * FROM games WHERE id=?", [gameID], (err, result) => {
    if (err) {
      console.error("❌ Select error:", err.code, err.message);
      return res.status(500).json({ error: err.code });
    }
    res.json(result[0]);
  });
});

// get user games
app.get("/me/games", verifyToken, (req, res) => {
  con.query(
    "SELECT * FROM games WHERE users_id = ? ORDER BY id DESC",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.code });
      res.json(rows);
    }
  );
});

app.post("/games", verifyToken, (req, res) => {
  const users_id = req.user.id;

  con.query(
    "INSERT INTO games (users_id, status, start_time) VALUES (?, 'ongoing', NOW())",
    [users_id],
    (err, result) => {
      if (err) {
        console.error("❌ Insert error:", err.code, err.message);
        return res.status(500).json({ error: err.code, message: err.message });
      }

      res.status(201).json({
        message: "✅ Game created successfully",
        game: {
          id: result.insertId,
          users_id,
          status: "ongoing",
          start_time: new Date(),
        },
      });
    }
  );
});
app.patch("/games",verifyToken, (req, res) => {
  const { status } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!["ongoing", "finished"].includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be 'ongoing' or 'finished'." });
  }

    con.query(
    "SELECT id FROM games WHERE users_id=? AND status='ongoing' ORDER BY id DESC LIMIT 1",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.code });

      if (!rows.length) {
        // ما فيه جلسة جارية لهذا المستخدم
        return res.status(404).json({ message: "No ongoing game" });
      }

            const gameId = rows[0].id;

  con.query(
    "UPDATE games SET status=? WHERE id=?",
    [status,gameId
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.code });
      if (!result.affectedRows) return res.status(404).json({ message: "No ongoing game" });
      res.json({ message: "✅ Current game updated", status });
    }
  );
});
});
app.patch("/games/:id", (req, res) => {
    const gameId = Number(req.params.id);
  const { status } = req.body;

  if (!["ongoing", "finished"].includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be 'ongoing' or 'finished'." });
  }

  con.query(
    "UPDATE games SET status=? WHERE id=?" ,
    [status,gameId
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.code });
      if (!result.affectedRows===0) return res.status(404).json({ message: "No ongoing game" });
      res.json({ message: "✅ Current game updated", status });
    }
  );
});

app.get("/scores", (req, res) => {
  con.query("SELECT * FROM scores", (err, result) => {
    if (err) {
      console.error("❌ Select error:", err.code, err.message);
      return res.status(500).json({ error: err.code });
    }
    res.json(result);
  });
  
});

//get scores by id
app.get("/scores/current", verifyToken, (req, res) => {
  const userId = req.user.id;
  con.query(
    "SELECT id FROM games WHERE users_id=? AND status='ongoing' ORDER BY id DESC LIMIT 1",
    [userId],
    (e, grows) => {
      if (e) return res.status(500).json({ error: e.code });
      if (!grows.length) return res.json([]);
      const gameId = grows[0].id;
      con.query(
        "SELECT * FROM scores WHERE game_id=? ORDER BY id ASC",
        [gameId],
        (e2, srows) => {
          if (e2) return res.status(500).json({ error: e2.code });
          res.json(srows);
        }
      );
    }
  );
});

// POST: إضافة سكور جديد
app.post("/scores/current", verifyToken, (req, res) => {
  const { team, score } = req.body;
  const userId = req.user.id;

  if (!team || score === undefined) {
    return res.status(400).json({ error: "team, score are required" });
  }

  con.query(
    "SELECT id FROM games WHERE users_id=? AND status='ongoing' ORDER BY id DESC LIMIT 1",
    [userId],
    (e, rows) => {
      if (e) return res.status(500).json({ error: e.code });
      if (!rows.length)
        return res.status(404).json({ error: "No ongoing game" });

      const gameId = rows[0].id;
      con.query(
        "INSERT INTO scores (game_id, team, score) VALUES (?, ?, ?) " +
          "ON DUPLICATE KEY UPDATE score = VALUES(score)",
        [gameId, String(team), Number(score)],
        (e2) => {
          if (e2) return res.status(500).json({ error: e2.code });

          res.status(201).json({
            message: "✅ Score added successfully",
            game_id: gameId,
            team: String(team),
            score: Number(score),
          });
        }
      );
    }
  );
});

app.listen(port, () => {
  console.log("Server is running on port", port);
});
