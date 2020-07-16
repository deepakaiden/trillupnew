const express = require("express");
const _router = express.Router();
const con = require("../config/db");
const dotenv = require("dotenv");
const multer = require("multer");

dotenv.config();

_router.get("/get-Register-users", (req, res) => {
    con.query("SELECT * FROM register", (error, rows) => {
        // console.log('test',rows);
        if (!error) {
            // console.log('tyy',res);
            res.send(rows);
        }
        else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
})

_router.post("/get-single-user-details", (req, res) => {
    con.query("SELECT * FROM register WHERE email = ?", [req.body.userEmail], (error, rows) => {
        // console.log('test',rows);
        if (!error) {
            //  console.log('tyy',res);
            res.send(rows[0]);
        }
        else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
});

// _router.put("/update-User", (req, res) => {
//     con.query("UPDATE register SET username = ?,email = ?, mobile = ? WHERE id = ?", [req.body.username, req.body.email, req.body.mobile, req.body.id], (error,results) => {
//         if (!error) {
//             res.setHeader('content-type','application/json');
//             return res.send(JSON.stringify(results));
//         }
//         else {
//             console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
//         }
//     });
// });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './src/assets/profile');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname);
    }
});

const upload = multer({
    storage: storage
}).single("profile");

_router.post('/update-User', (req, res, next)=>{
    upload(req, res, (err) => {
        if(err) res.send({msg: err});
        else {
            let path = "./src/assets/profile" + req.file.filename;
            // let path = fs.readFileSync(req.file.path);
            con.query("UPDATE register SET username = ?, email = ?, mobile = ?, profile = ? WHERE id = ?", [req.body.username, req.body.email, req.body.mobile, path, req.body.id], (error) => {
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
module.exports = _router;