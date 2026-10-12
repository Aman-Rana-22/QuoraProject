const { faker } = require('@faker-js/faker');
const  mysql  = require('mysql2');
const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const { connect } = require('http2');
require('dotenv').config();

app.use(methodOverride("_method"));
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

const port = "8080";
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD
});

// let q = "INSERT INTO user (id, username, email, password) VALUES ?";

let getRandomUser = () => {
    return [
        faker.string.uuid(),
        faker.internet.username(),
        faker.internet.email(),
        faker.internet.password(),
    ];
};

// let data = [];
// for (let i = 0; i<= 100; i++) {
//     data.push(getRandomUser());
// }

// connection.end();

app.get("/", (req, res) => {
    let q = `SELECT COUNT(*) FROM user`;
    try {
        connection.query(q, (err, result) => {
            if(err) throw err;
            let count = result[0]["COUNT(*)"];
            res.render("home.ejs", {count});
        });
    }catch(err){
        console.log(err);
        res.send("some error in db");
    }
});

app.get("/user/new", (req, res) => {
    res.render("new.ejs");
});

app.post("/user", (req, res) => {
    let { username, email, password } = req.body;

    let id = faker.string.uuid();

    let q = `INSERT INTO user (id, username, email, password) VALUES (?, ?, ?, ?)`;
    connection.query(q,[id, username, email, password], (err, result) => {
        if(err){
            console.log(err);
            return res.status(500).send("Error Creating user");
        }
        res.redirect("/user");
    }
    );
});

app.get("/user", (req, res) => {
    let q = `SELECT * FROM user`;
    
     try {
        connection.query(q, (err, users) => {
            if(err) throw err;
            res.render("showuser.ejs", { users });
        });
    }catch(err){
        console.log(err);
        res.send("some error in db");
    }
});

app.get("/user/:id/edit",(req,res) => {
    let {id} = req.params;
    let q = `SELECT * FROM user WHERE id = '${id}'`;

    try {
        connection.query(q, (err, result) => {
            if (err) throw err;
            let user = result[0];
            res.render("edit.ejs", { user });
        });
    }catch(err) {
        console.log(err);
        res.send("some error in DB");
    }
});

app.get("/user/:id/delete", (req, res) => {
    let { id }= req.params;

    let q = `SELECT * FROM user WHERE id = ?`;

    connection.query(q, [id], (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).send("Error fetching user");
        }
        if(result.length === 0) {
            return res.status(404).send("user not found");
        } 

        let user = result[0];
        res.render("delete.ejs", { user });
    });
});

app.post("/user/:id/delete", (req, res) => {
    let { id } = req.params;
    let { email, password } = req.body;

    let q = `SELECT * FROM user WHERE id = ?`;

    connection.query(q, [id], (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).send("Error checking user");
        }
        if (result.length === 0){
            return res.status(404).send("user not found");
        }

        let user = result[0];

        if(email !== user.email || password !== user.password) {
            return res.status(401).send("Wrong email or password");
        }

        let q2 = `DELETE FROM user WHERE id = ?`;

        connection.query(q2, [id], (err, result) => {
            if(err){
                console.log(err);
                return res.status(500).send("Error Deleting User");
            }

            if(result.affectedRows === 0){
                return res.status(404).send("User not found");
            }

            res.redirect("/user");
        });
    });
});


app.patch("/user/:id", (req, res) => {
    let { id } = req.params;
    let {password: formPass, username: newUsername} = req.body;
    let q = `SELECT * FROM user WHERE id ='${id}'`;

    try {
        connection.query(q, (err, result) => {
            if (err) throw err;
            let user = result[0];
            if(formPass != user.password) {
                res.send("Wrong Password");
            }else {
                let q2 = `UPDATE user SET username = '${newUsername}' WHERE id = '${id}'`;
                connection.query(q2, (err, result) => {
                    if(err) throw err;
                    res.redirect("/user");
                })
            }
        });
    }catch (err) {
        console.log(err);
        res.send("Some Error in DB");
    }
});

app.listen(port, () => {
    console.log(`App is listening on ${port}`);
});



// console.log(getRandomUser());