const express = require("express");
const _router = express.Router();
const con = require("../config/db");
const dotenv = require("dotenv");
const multer = require("multer");

const storage1 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './src/assets/newsfeed');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname);
    }
});

const upload1 = multer({
    storage: storage1
}).single("image");

_router.post('/file-upload', (req, res, next)=>{
    upload1(req, res, (err) => {
        if(err) res.send({msg: err});
        else {
            let path = "./assets/newsfeed/" + req.file.filename;
            // let path = fs.readFileSync(req.file.path);
            con.query("INSERT INTO newsfeed(message,image) VALUES(?,?)", [req.body.message, path], (error) => {
                if (!error) {
                    res.send({ msg: "success" });
                }
                else {
                    console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
                }
            });
        }
    });
})


_router.get("/uploadfiles",  (req, res) => {
    con.query("SELECT * FROM newsfeed", (error, rows) => {
        // console.log('test',rows);
        if (!error) {
            // console.log('tyy',res);
            res.send(rows);
        }
        else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
});

module.exports = _router;