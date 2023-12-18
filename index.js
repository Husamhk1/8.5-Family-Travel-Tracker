import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "FamilyTracker",
  password: "admin",
  port: 5433,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Anika", color: "pink" },
  { id: 2, name: "Sam", color: "powderblue" },
];
async function checkUser(){
  const usersTable = await db.query("SELECT * FROM users;");
  users = usersTable.rows;
  return users.find((user) => user.id == currentUserId);

}



async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM users u inner join  visited_countries v on  u.id = v.user_id where v.user_id = $1",
  [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
app.get("/", async (req, res) => {
  const curentUser = await checkUser();
  const countries = await checkVisisted();
  
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: curentUser.color,
  });
});

app.post("/add", async (req, res) => {
  const curentUser = await checkUser();
  const input = req.body["country"];
  console.log(curentUser.id);
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1,$2)",
        [countryCode,currentUserId]
      )
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  try {
    if(req.body.add === "new"){
      res.render("new.ejs")
    }else{
      currentUserId = req.body.user; 
      console.log(currentUserId)
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
  }

});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const userName = req.body.name;
  const userColor = req.body.color;
  console.log(userColor);
  console.log(userName);
  try{
    const newUser = await db.query("INSERT INTO USERS (name, color) values ($1,$2) RETURNING *" ,
    [userName,userColor]);
    currentUserId =newUser.rows[0].id;
    console.log(newUser)
    res.redirect("/");
  }catch (err){
    
    console.log(err);

  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
