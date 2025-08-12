import express from "express";
import mysql from "mysql2";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());

const port = process.env.PORT || 3000;

let con = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Aoo12aoo",
  database: process.env.DB_NAME || "balot_game",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
});

con.connect((err) => {
  if (err) {
    console.error("❌ MySQL connect error:", err.code, err.message);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

con.connect((err) => {
  if (err) {
    console.error("❌ MySQL connect error:", err.code, err.message);
  } else {
    console.log("✅ Connected to MySQL");
  }
});


//get all users
app.get("/users", (req, res) => {
  con.query("SELECT * FROM users", (err, result) => {
    if (err) {
      console.error("❌ Select error:", err.code, err.message);
      return res.status(500).json({ error: err.code });
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
      return res.status(500).json({ error: err.code });
    }
    return res.json(result[0]);
  });
});

//insert new user
app.post("/users",(req,res)=>{
const username=req.body.username;
con.query("INSERT INTO users (username) VALUES (?)",[username], (err,result)=>{

    if(err){
       return res.status(500).send(err)
    }
   return  res.json({id:result.insertId,username})
})
})

app.delete("/users/:id",(req,res)=>{
const ID=req.params.id

con.query("DELETE FROM users WHERE id=?",[ID],(err,result)=>{

  if (err) {
      console.error("❌ Delete error:", err.code);
      return res.status(500).json({ error: err.code });
    }
     if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "✅ Delete successful" });
})
})

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
    res.json(result);
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
          start_time: new Date()
        }
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
      error: "Invalid status. Must be 'ongoing' or 'finished'."
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
app.get("/scores/:game_id",(req,res)=>{
const gameId=req.params.game_id;

con.query("SELECT * FROM scores WHERE game_id=? ORDER BY id ASC", [gameId], (err, result) => {

if(err){
    console.log("Error Get Scores",err.code);
      return res.status(500).json({ error: err.code });
}
res.json(result);
})
});


// POST: إضافة سكور جديد
app.post("/scores", (req, res) => {
  const { game_id, team, score} = req.body;

  // التحقق من القيم
  if (!game_id || !team || score === undefined ) {
    return res.status(400).json({ 
      error: "game_id, team, score are required" 
    });
  }

  con.query(
    "INSERT INTO scores (game_id, team, score) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE score = VALUES(score) " ,
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


