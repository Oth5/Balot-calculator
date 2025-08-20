import express from "express";
import mysql from "mysql2";
import bodyParser from "body-parser";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.redirect("/login.html");
});

app.use(express.static("./public"));

const port = process.env.PORT || 3000;
let con;

function connectWithRetry(attempt = 1) {
  con = mysql.createConnection({
    host: process.env.MYSQLHOST ,
    user: process.env.MYSQLUSER ,
    password: process.env.MYSQLPASSWORD ,
    database: process.env.MYSQLDATABASE ,
    port: Number(process.env.MYSQLPORT) ,
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

//auth register signup
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

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
          role: "user"
        });
      }
    );
  } catch (err) {
    console.error("❌ Hashing error:", err.message);
    res.status(500).json({ error: "Hashing failed", message: err.message });
  }
});

//login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  con.query(
    "SELECT id, username, password, role FROM users WHERE username = ?",
    [username],
    async (err, rows) => {
      if (err) return res.status(500).json({ error: err.code, message: err.sqlMessage });
      if (!rows.length) return res.status(401).json({ error: "Invalid username or password" });

      const user = rows[0];

      try {
        const match = await bcrypt.compare(password, user.password || "");
        if (!match) {
          return res.status(401).json({ error: "Invalid username or password" });
        }

        if (user.role === "admin") {
          return res.json({
            message: "✅ Login successful (Admin)",
            id: user.id, username: user.username, role: user.role ,
          });
        } else {
          return res.json({
            message: "✅ Login successful (User)",
            id: user.id, username: user.username, role: user.role ,
          });
        }

      } catch (e) {
        console.error("❌ Password comparison error:", e.message);
        return res.status(500).json({ error: "COMPARE_FAILED" });
      }
    }
  );
});


//get all users
app.get("/users", (req, res) => {
  con.query("SELECT * FROM users", (err, result) => {
    if (err) {
      console.error("❌ Select error:", err.code, err.message);
      return res.status(500).json({ error: err.code, message: err.sqlMessage });
    }
    res.json(result);
  });
});

//get specific user
app.get("/users/:id", (req, res) => {
  const userID = req.params.id;

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

app.delete("/users/:id", (req, res) => {
  const ID = req.params.id;

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
  con.query("SELECT * FROM games", (err, result) => {
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
app.get("/users/:id/games", (req, res) => {
  con.query("SELECT * FROM games WHERE users_id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.code });
    res.json(rows); 
  });
});


app.post("/games", (req, res) => {
  const { users_id } = req.body;

  if (!users_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

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

app.patch("/games/:id", (req, res) => {
  const ID = req.params.id;
  const { status } = req.body;

  // تحقق أن القيمة إما ongoing أو finished
  if (!["ongoing", "finished"].includes(status)) {
    return res.status(400).json({
      error: "Invalid status. Must be 'ongoing' or 'finished'.",
    });
  }

  con.query(
    "UPDATE games SET status = ? WHERE id = ?",
    [status, ID],
    (err, result) => {
      if (err) {
        console.error("❌ Update error:", err.code);
        return res.status(500).json({ error: err.code });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Game not found" });
      }

      res.json({ message: "Game updated successfully", id: ID, status });
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
app.get("/scores/:game_id", (req, res) => {
  const gameId = req.params.game_id;

  con.query(
    "SELECT * FROM scores WHERE game_id=? ORDER BY id ASC",
    [gameId],
    (err, result) => {
      if (err) {
        console.log("Error Get Scores", err.code);
        return res.status(500).json({ error: err.code });
      }
      res.json(result);
    }
  );
});

// POST: إضافة سكور جديد
app.post("/scores", (req, res) => {
  const { game_id, team, score } = req.body;

  // التحقق من القيم
  if (!game_id || !team || score === undefined) {
    return res.status(400).json({
      error: "game_id, team, score are required",
    });
  }

  con.query(
    "INSERT INTO scores (game_id, team, score) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score) ",
    [game_id, team, score],
    (err, result) => {
      if (err) {
        console.error("❌ Insert score error:", err.code, err.message);
        return res.status(500).json({ error: err.code });
      }

      res.status(201).json({
        message: "✅ Score added successfully",
        id: result.insertId,
        game_id,
        team,
        score,
      });
    }
  );
});

app.listen(port, () => {
  console.log("Server is running on port", port);
});
