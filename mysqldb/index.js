"use strict";

const express = require('express');
const mysql = require('mysql');
let app = express();
let bodyparser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
let jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require("path");
const downloadsFolder = require('downloads-folder');
const http = require("http");
const moment = require('moment');
const mailFun = require('./helper/mail');
var admin = require('firebase-admin');
var uniqid = require("uniqid");
const commonFunction = require('./helper/commonFunction');
var multer = require("multer");

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://push-notification-testin-fb795.firebaseio.com"
});

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: true
}));

app.use('/upload', express.static('upload'));

app.use(cors({ origin: "*" }));

const server = http.createServer(app);
const io = require("socket.io")(server);

const channelFileUploadPath = 'upload/userfile/';

// An array to store current online users
const onlineUsers = [];
var onlineUsersById = [];
var onlineUserPushNotificationTokenArr = [];
const users = {};

// To establish a connection mysql server 
// let dbConfig = {
//     host: "trillupadmin.cscchlnqcc9q.us-west-1.rds.amazonaws.com",
//     user: 'trillupadmin',
//     password: "OfQ2LGlbAYhKjy9Lv8bh",
//     database: 'trillup'
// }
let dbConfig = {
    host: "localhost",
    user: 'root',
    password: "root",
    database: 'trillup'
}

global.con = mysql.createConnection(dbConfig)

// to check wheathe connection is establish or not
con.connect(function (error) {
    if (!error) {
        console.log("DB connection is established");
    }
    else {
        console.log('DB connection failed \n Error' + JSON.stringify(error, undefined, 2));
    }
});

server.listen(3000, () => console.log('express server is running at port number:3000'));

// create express peer server
app.use('/peerjs', require('peer').ExpressPeerServer(server, {
    debug: false
}))

io.listen(server);

io.on("connection", socket => {
    // console.log("User connected");
    let userId = parseInt(socket.handshake.query.userId);
    let uId = parseInt(socket.handshake.query.userId);
    // console.log("New connection was made:", socket.id);

    socket.on('check-message', (message) => {
        // console.log(message);
        sendPushNotificationToTeamChannel(message);
        io.emit("check-message", message);
    });

    socket.on('push_notification', (data) => {
        // console.log(data);
        saveToken(data)
    })

    socket.on('upsert_peerjs_id', async (data) => {
        // console.log(data);
        await upsertPeerIdByuserId(data);
        io.emit('upsert_peerjs_id', data);
    })

    socket.on('change_team_channel_screen_sharing_status', async (data) => {
        // console.log(data);
        await updateScreenSharingStatusForTeamChannel(data);
        io.emit('change_team_channel_screen_sharing_status', data);
    })

    socket.on('user_screen_sharing_status', async (data) => {
        // console.log(data);
        await updateScreenSharingStatusForUser(data);
        io.emit('user_screen_sharing_status', data);
    })

    socket.on('accept_team_channel_call', async (data) => {
        io.emit('accept_team_channel_call', data);
    })

    socket.on('accept_user_screen_sharing_call', async (data) => {
        io.emit('accept_user_screen_sharing_call', data);
    })

    socket.on("online_user", (uId) => {
        onlineUsersById.push(uId);
        onlineUsersById = [...new Set(onlineUsersById)];
        io.emit('online_user', onlineUsersById)
    })
    socket.on("offline_user", (uId) => {
        onlineUsersById.splice(onlineUsersById.indexOf(uId), 1);
        io.emit('online_user', onlineUsersById)
    })

    // attach incoming listener for new user
    socket.on("user_connected", (email) => {
        // console.log(email);
        // an array to find the no. of users currently online
        onlineUsers.push(userId);

        // save in users object
        users[email] = socket.id;
        // console.log(users[email]);

        // socket ID will be used to send message to individual person

        // notify all connected clients
        io.emit("online_users", onlineUsers);
    });

    socket.on("send_message", async (data) => {
        // console.log(data);
        let creationDate = new Date();
        let uIdResult = await getRegisterIdByEmail(data.receiver);
        let senderIdResult = await getRegisterIdByEmail(data.sender);

        con.query("INSERT INTO chat_messages (sender, receiver, message, sent_on) VALUES(?, ?, ?, ?)", [data.sender, data.receiver, data.message, creationDate], (error, results) => {
            if (!error) {
                // send message to receiver
                let socketId = users[data.receiver];
                io.to(socketId).emit("new_message", data);
                sendPushNotificationToIndividual({
                    uId: uIdResult[0] ? uIdResult[0].id : null,
                    senderId: senderIdResult[0] ? senderIdResult[0].id : null,
                    message: data.message
                });
            } else {
                console.log('DB connection failed \n Error' + JSON.stringify(error, undefined, 2));
            }
        });
    });

    socket.on("disconnect", () => {
        // console.log("page refress")
        onlineUsersById.indexOf(uId) > 0 ? onlineUsersById.splice(onlineUsersById.indexOf(uId), 1) : '';
        io.emit('online_user', onlineUsersById)
        // console.log("User disconnected");
        con.query("SELECT email FROM register WHERE id = ?", [userId], (error, row) => {
            if (!error) {
                // To remove the user id of disconnected user
                onlineUsers.splice(onlineUsers.indexOf(userId), 1);

                // To remove the socket id of the disconnected user
                delete users[row[0].email];

                // notify all connected clients
                io.emit("online_users", onlineUsers);
            } else {
                console.log('DB connection failed \n Error' + JSON.stringify(error, undefined, 2));
            }
        });
    });
});

async function getRegisterIdByEmail(email) {
    return commonFunction.createQuery(`SELECT id FROM register WHERE email = ?`, [email]);
}

// subdomain check for every api call
// app.get('*', (req, res, next) => {
//     // no subdomain
//     if (req.subdomain) {
//         console.log(req.subdomain);
//         res.send({ message: 'we got subdomain here' });
//     } else {
//         next();
//     }

// });

// To get the email id of a an user
app.get("/getUserEmail/:id", (req, res) => {
    con.query("SELECT email FROM register WHERE id=?", [req.params.id], (error, row) => {
        if (!error) {
            res.send({ email: row[0].email });
        } else {
            console.log('DB connection failed \n Error' + JSON.stringify(error, undefined, 2));
        }
    });
});

// to get the messages from chat_messages table
app.post("/getMessages", (req, res) => {
    con.query("SELECT message, sender FROM chat_messages WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) ORDER BY sent_on ASC", [req.body.sender, req.body.receiver, req.body.receiver, req.body.sender], (error, messages) => {
        if (!error) {
            res.send(messages);
        } else {
            console.log('DB connection failed \n Error' + JSON.stringify(error, undefined, 2));
        }
    });
});

// Insert an user into signup table
app.post("/addUser", (req, res) => {
    // console.log('jhjgh',req.body.share)
    con.query("INSERT INTO webinar (firstname, message, datetime,duration,mints,screen,share) VALUES(?, ?, ?, ?,?,?,?)", [req.body.firstname, req.body.message, req.body.datetime, req.body.duration, req.body.mints, req.body.screen, req.body.share], (error, results) => {
        if (!error) {
            res.setHeader('content-type', 'application/json');
            return res.send(JSON.stringify(results));
        }
        else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
});

let rand, host, link;
// New user registration
app.post("/addNewUser", (req, res) => {
    // console.log(req);
    con.query("INSERT INTO register (username,password, email,phone, company_id) VALUES(?,?,?,?,?)", [req.body.username, req.body.password, req.body.email, req.body.phone, req.body.companyId], (error, results) => {
        if (!error) {
            res.setHeader('content-type', 'application/json');
            // console.log('result',results);
            rand = Math.floor((Math.random() * 100) + 54);
            host = req.get('host');
            link = "http://" + req.get('host') + "/verifyemail?id=" + rand + "&email=" + req.body.email;
            sendEmail(req.body.email);
            return res.send(JSON.stringify(results));
        }
        else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
});


const imgStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './upload/compLogo');
    },
    filename: function (req, file, cb) {
        let mimetype = file.originalname.split('.');
        cb(null, file.fieldname + '_' + Date.now() + '.' + mimetype[1])
    }
})
var uploadCompLogo = multer({
    storage: imgStorage
}).single("complogo");

// New Company registration
app.post("/addNewCompany", (req, res) => {
    // console.log(req);
    uploadCompLogo(req, res, (err) => {
        if (err) res.status(501).send({ msg: 'Error While uploading images' });
        else {
            let insertData = JSON.parse(req.body.otherData);
            let companySlang = ((insertData.companyname).split(" ").join("")).toLowerCase();

            let message = req.file.originalname;
            let imgName = req.file.filename;
            con.query("INSERT INTO company_register (company_name,company_slag,user_pic) VALUES(?,?,?)", [insertData.companyname, companySlang, imgName], (error, results) => {
                if (!error) {
                    // res.redirect(302, `http://${companySlang}.trillup.com`) //+companySlang
                    // res.redirect(302, `https://${companySlang}.trillup.com`) //+companySlang
                    return res.status(200).send({ message: companySlang });
                }
                else {
                    return res.status(501).send({ message: 'Error While Registering Company' });
                    // console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
                }
            });
        }
    })
});

//Check company name already added or not
app.post("/checkAvailability", (req, res) => {
    let cName = req.body.cName ? req.body.cName.toLowerCase() : null;
    if (cName) {
        con.query("SELECT * FROM company_register WHERE LOWER(company_name) = ?", [cName], (error, rows) => {
            if (!error) {
                if (rows.length > 0) {
                    res.send({ msg: "exists" });
                } else {
                    res.send({ msg: "not exists" });
                }
            }
            else {
                console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
                res.status(501).send({ message: 'Error While checking company registration' });
            }
        })
    } else {
        res.status(401).send({ message: 'Mandatory Parameter Is Missing' });
    }
})

// Login function
app.post("/signin", (req, res) => {
    con.query("SELECT * FROM register WHERE username = ? AND company_id = ?", [req.body.username, req.body.companyId], (error, rows) => {
        if (!error) {
            if (rows.length > 0) {
                if (rows[0].password === req.body.password) {
                    // res.send({msg: "User logged in Successfully"});
                    let token = jwt.sign({ userId: rows[0].id, companyId: rows[0].company_id }, 'secret');

                    res.status(200).send({ token: token });
                } else {
                    res.send({ msg: "Invalid Password." });
                }
            } else {
                res.send({ msg: "User does not exists." });
            }
        }
        else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
});

//get all users
app.get("/getAllUser/:uId", verifyToken, (req, res) => {
    let uId = req.params.uId;
    con.query("SELECT c.id, c.content, c.type, c.createdAt, r.username FROM `channel_user` cu JOIN channel c ON c.id = cu.cId JOIN register r ON r.id = c.createdBy where cu.uId = ? AND cu.isRequest = ? ORDER BY c.createdAt DESC", [uId, '2'], (error, rows) => {
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

//get all users from register table
app.get("/getCurrentUser/:id", verifyToken, (req, res) => {
    con.query("SELECT * FROM register WHERE id = ?", [req.params.id], (error, rows) => {
        // console.log('test',rows);
        if (!error) {
            // console.log('tyy',res);
            res.send({ currentUser: rows[0] });
        }
        else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
});

//get all users from register table
app.get("/getRegisterDetails/:cId", verifyToken, async (req, res) => {
    // let cId = req.param.cId;
    let companyId = req.companyId;
    con.query("SELECT * FROM register WHERE company_id = ?", [companyId], (error, rows) => {
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
// get the schedule webinar history
app.get("/getWebinarHistory", verifyToken, (req, res) => {
    con.query("SELECT * FROM webinar", (error, rows) => {
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

app.post('/sendChannel', (req, res) => {
    res.setHeader('content-type', 'application/json');
    let chnType = (req.body.chnType == true) ? "0" : "1";
    // console.log(chnType);
    con.query('INSERT INTO channel (content, createdBy, description, type, createdAt) VALUES (?,?,?,?,?)',
        [req.body.content, req.body.createdBy, req.body.description, chnType, req.body.creationDate],
        (error, result) => {
            if (error) {
                // console.log(error);
                return res.status(501).send({ message: 'Error while creating channel' });
            } else {

                let channelId = result.insertId;

                con.query(`INSERT INTO channel_user (cId, uId, type, isRequest) VALUES (?,?,?,?)`,
                    [channelId, req.body.createdBy, req.body.type, req.body.isRequest], (err, result) => {
                        // console.log(err);
                        if (err) return res.status(501).send({ message: 'Error while creating channel' });
                        res.status(200).send({ message: 'Channel has been created' });
                    })
            }
        });
});

app.post('/groupnames', (req, res) => {
    //console.log(req.body);
    con.query('INSERT INTO group_names (username) VALUES (?)', [req.body.username], (error, results) => {

        if (!error) {
            res.setHeader('content-type', 'application/json');
            // console.log('result',results);
            return res.send(JSON.stringify(results));
        }
        else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
});

app.get("/getgroupnames", verifyToken, (req, res) => {
    con.query("SELECT * FROM group_names", (error, rows) => {
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
// Function to send an email
function sendEmail(toAddress) {
    // process.env.NODE_TLS_REJECT_UNAUTHORIZED ="0";

    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: 'agarapunaveen@gmail.com',
            pass: 'naveenmohan'
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: '"Rayies Pvt Ltd." <agarapunaveen@gmail.com>',
        to: toAddress,
        subject: "Please confirm your Email account",
        html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message  %s', info);
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
}

app.get('/verifyemail', function (req, res) {
    // console.log(req.protocol + ":/" + req.get('host'));

    if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
        // console.log("Domain is matched. Information is from Authentic email");
        if (req.query.id == rand) {
            // console.log("email is verified");
            res.end("<h1>Your " + req.query.email + " has been successfully verified.");
        }
        else {
            // console.log("email is not verified");
            res.end("<h1>Bad Request</h1>");
        }
    }
    else {
        res.end("<h1>Request is from unknown source");
    }
});

// get all channel registration details
app.get("/getAllChannles", verifyToken, (req, res) => {
    con.query("SELECT * FROM channel", (error, rows) => {
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
// get all the data
app.get("/getSingleData/:id", verifyToken, (req, res) => {
    con.query("SELECT * FROM channel WHERE id = ?", [req.params.id], (error, results, fields) => {
        if (!error) {
            res.setHeader('content-type', 'application/json');
            return res.send(JSON.stringify(results[0]));
        }
        else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
});

// delete single user

// Delete an single user from uploaded table
app.delete("/deleteSingleData/:id", verifyToken, (req, res) => {
    con.query("DELETE FROM uploaded WHERE id = ?", [req.params.id], (error, results) => {
        if (!error) {
            // res.send({ 'deleted': true ,'response':200});
            res.setHeader('content-type', 'application/json');
            return res.send(JSON.stringify(results));
        }
        else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
});

// file sharing

var multer = require("multer");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './upload/file');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
var upload = multer({
    storage: storage
}).single("uploadImg");

app.post('/file', (req, res, next) => {
    upload(req, res, (err) => {
        if (err) res.send({ msg: err });
        else {
            // let path = "uploads/" + req.file.filename;
            // console.log(req.file.uploadImg.path);
            let image = fs.readFileSync(req.file.path);
            // console.log('file', image)
            con.query("INSERT INTO uploaded (imgname, image) VALUES(?, ?)", [req.file.filename, image], (error) => {
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

// get all shared-files details
app.get("/uploadfiles", verifyToken, (req, res) => {
    con.query("SELECT * FROM uploaded", (error, rows) => {
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

// Route to upload image
app.get("/getImage/:id", verifyToken, (req, res) => {
    // console.log(req.params.id);
    // res.send({msg: "Download Router"});
    con.query("SELECT * FROM uploaded WHERE id = ?", [req.params.id], (error, result) => {
        if (!error) {
            // console.log(result[0]);
            // const imgFile = blobToFile(result[0].image, result[0].imgname);
            // console.log(downloadsFolder() + "/" + result[0].imgname);
            // fs.writeFileSync(downloadsFolder() + "/" + result[0].imgname, imgFile, "UTF8");
            res.send({
                file: result[0].image,
                fileName: result[0].imgname
            });
        } else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
});

// Function to convert BLOB to file
function blobToFile(theBlob, fileName) {
    theBlob.lastModifiedDate = new Date();
    theBlob.name = fileName;
    return theBlob;
}


// get single data
app.get("/getSingleData/:id", verifyToken, (req, res) => {
    con.query("SELECT * FROM register WHERE id = ?", [req.params.id], (error, results, fields) => {
        if (!error) {
            res.setHeader('content-type', 'application/json');
            return res.send(JSON.stringify(results));
        }
        else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
});

// Update an User in User table
app.put("/updateUser/:id", verifyToken, (req, res) => {
    con.query("UPDATE register SET username = ?, password=?,email = ?, phone = ? WHERE id = ?", [req.body.username, req.body.password, req.body.email, req.body.phone, req.params.id], (error, results) => {
        if (!error) {
            res.setHeader('content-type', 'application/json');
            return res.send(JSON.stringify(results));
        }
        else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
});


// Function to verify the token
function verifyToken(req, res, next) {
    // console.log('tt',req.body);
    const header = req.headers['authorization'];
    // console.log('header', header);
    if (typeof header !== "undefined") {
        const bearer = header.split(" ");
        const token = bearer[1];
        // console.log(token);
        jwt.verify(token, "secret", (error, decoded) => {
            if (!error) {
                // console.log(decoded);
                req.companyId = decoded.companyId;
                next();
            } else {
                return res.status(401).send({ msg: "Unautherized request" });
            }
        });
    } else {
        res.status(403).send("Token is missing");
    }
}

// newsfeed
const storage1 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './upload/newsfeed');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
})
var upload1 = multer({
    storage: storage1
}).single("image");

app.post('/newsfeed', (req, res, next) => {
    // console.log(req.body);
    upload1(req, res, (err) => {
        if (err) res.send({ msg: err });
        else {
            let path = "upload/newsfeed/" + req.file.filename;
            // console.log('ahi', path);
            con.query('INSERT INTO news (firstName,image) VALUES (?,?)', [req.body.firstName, path], (error, results) => {
                if (!error) {
                    res.setHeader('content-type', 'application/json');
                    // console.log('result',results);
                    return res.send(JSON.stringify(results));
                }
                else {
                    console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
                }
            });
        }
    });
})
// to get the newsfeed information
app.get("/getnewsfeed", verifyToken, (req, res) => {
    con.query("SELECT * FROM news", (error, rows) => {
        // console.log('test',rows);
        if (!error) {
            res.send(rows);
            // res.send({
            //     file: result[0].image,
            //     fileName: result[0].imgname
            // });
        }
        else {
            console.log("Query failed \n Error " + JSON.stringify(error, undefined, 2));
        }
    });
});


app.post('/createNewGroup', verifyToken, (req, res) => {
    res.setHeader('content-type', 'application/json');
    // console.log(req.body);
    let { groupName, uId, type } = req.body;
    con.query(`INSERT INTO chat_group (name) VALUES (?)`, [groupName], (error, result) => {
        // console.error(error);
        if (error) return res.status(501).send({ message: "Error While Creating Group" });
        // console.log(result);
        let groupId = result.insertId;
        con.query(`INSERT INTO chat_group_user (groupId, uId, type) VALUES (?,?,?)`, [groupId, uId, type], (error, groupChatUserResult) => {
            // console.log(error);
            if (error) return res.status(501).send({ message: "Error While Creating Group" });
            return res.status(201).send({ message: "Group Created" });
        })

    })
})

app.get('/getAllGroup/:uId', verifyToken, (req, res) => {
    res.setHeader('content-type', 'application/json');
    // console.log(req.body);
    let uId = req.params.uId;
    con.query(`SELECT * FROM chat_group_user cgu JOIN chat_group cg ON cgu.groupId = cg.id WHERE uId = ? ORDER BY cg.updatedAt DESC`, [uId], (error, result) => {
        // console.error(error);
        if (error) return res.status(501).send({ message: "Error While Creating Group" });

        return res.status(201).send(result);

    })
})

app.get('/getChannelById/:cId/:uId', verifyToken, (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.params.cId;
    let uId = req.params.uId;
    con.query(`SELECT * FROM channel WHERE id IN (SELECT cId FROM channel_user WHERE cId = ? AND uId = ? AND isRequest = ?)`, [cId, uId, '2'], (error, result) => {
        // console.error(error);
        if (error) return res.status(501).send({ message: "Error While Fetching channel users" });
        return res.status(200).send(result);
    })
})

app.get('/getTeamChannelUser/:cId', verifyToken, (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.params.cId;
    con.query(`SELECT cId, uId, cu.type, c.type as chntype, username, email, cu.isRequest FROM channel_user cu JOIN channel c ON c.id = cu.cId JOIN register r ON r.id = cu.uId WHERE cId = ? and cu.isRequest = '2'`, [cId], (error, result) => {
        // console.error(error);
        if (error) return res.status(501).send({ message: "Error While Fetching channel users" });
        return res.status(200).send(result);
    })
})

app.get('/getResgiterUserForTeamUserListing/:cId', verifyToken, (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.params.cId;
    let companyId = req.companyId;
    // console.log(companyId);
    con.query(`
    SELECT id,username,email FROM register WHERE id NOT IN (SELECT cu.uId FROM channel_user cu JOIN channel c ON c.id = cu.cId JOIN register r ON r.id = cu.uId WHERE cu.cId = ?) AND company_id = ?`, [cId, companyId], (error, result) => {
        // console.error(error);
        if (error) return res.status(501).send({ message: "Error While Fetching channel users" });
        con.query(`SELECT r.id, r.username, r.email, cu.isRequest FROM register r JOIN channel_user cu ON cu.uId = r.id JOIN channel c ON c.id = cu.cId WHERE cu.cId = ? AND cu.isRequest = '1' AND r.company_id = ?`, [cId, companyId], (error, requestedResult) => {
            // console.error(error);
            if (error) return res.status(501).send({ message: "Error While Fetching channel users" });
            result = result.concat(requestedResult);
            return res.status(200).send(result);
        })
    })
})

app.get('/getCurrentUserTeamChannelDetail/:cId/:uId', verifyToken, (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.params.cId;
    let uId = req.params.uId;
    con.query(`SELECT cId, uId, type, username, email FROM channel_user cu JOIN channel c ON c.id = cu.cId JOIN register r ON r.id = cu.uId WHERE cu.cId = ? AND cu.uId = ?`, [cId, uId], (error, result) => {
        // console.error(error);
        if (error) return res.status(501).send({ message: "Error While Fetching channel users" });
        return res.status(200).send(result);
    })
})

app.post('/addUserIntoTeamChannel', verifyToken, (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.body.cId;
    let uId = req.body.uId;
    let type = req.body.type;
    let request = '2';
    con.query(`INSERT INTO channel_user (cId, uId, type, isRequest) VALUES (?,?,?,?)`,
        [cId, uId, type, request], (err, result) => {
            // console.log(err);
            if (err) return res.status(501).send({ message: 'Error while adding user into channel' });
            res.status(200).send({ message: 'User has been added to channel' });
        })
})

app.post('/deleteUserIntoTeamChannel', verifyToken, (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.body.cId;
    let uId = req.body.uId;
    con.query(`DELETE FROM channel_user WHERE cId = ? AND uId = ?`,
        [cId, uId], (err, result) => {
            // console.log(err);
            if (err) return res.status(501).send({ message: 'Error while deleting user from channel' });
            res.status(200).send({ message: 'User has been deleted from channel' });
        })
})

app.post('/changeUserType', verifyToken, (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.body.cId;
    let uId = req.body.uId;
    let type = req.body.type;
    // console.log(cId, uId, type);
    con.query(`UPDATE channel_user SET type = ? WHERE cId = ? AND uId = ?`,
        [type, cId, uId], (err, result) => {
            // console.log(err);
            if (err) return res.status(501).send({ message: 'Error while changing user type in channel user' });
            res.status(200).send({ message: 'User has been change' });
        })
})


//Team Channel file upload 
const filesStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './upload/userfile');
    },
    filename: function (req, file, cb) {
        let mimetype = file.originalname.split('.');
        cb(null, file.fieldname + '_' + Date.now() + '.' + mimetype[1])
    }
})
var uploadUserFile = multer({
    storage: filesStorage
}).single("userFile");

app.post('/uploadFile', (req, res) => {
    uploadUserFile(req, res, (err) => {
        // console.log(err);
        if (err) res.send({ msg: err });
        else {
            let insertData = JSON.parse(req.body.otherData);
            // console.log(insertData, req.file);

            let cId = insertData.cId;
            let uId = insertData.uId;
            let message = req.file.originalname;
            let messageType = "1";
            let originalName = req.file.filename;

            con.query(`INSERT INTO channel_user_messages (cId, uId, message, messageType, dbFileName) VALUES (?,?,?,?,?)`,
                [cId, uId, message, messageType, originalName], (err, result) => {
                    // console.log(err);
                    if (err) return res.status(501).send({ message: 'Error while adding user into channel_user_messages' });
                    res.status(200).send({ message: 'User File has been uploaded to channel_user_messages' });
                })
        }
    })
});

app.post('/getChannelMessages', verifyToken, (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.body.cId;
    let skip = req.body.skip;
    let limit = req.body.limit;
    let order = limit == 1 ? 'DESC' : 'ASC';
    let messageType = req.body.messageType == 1 ? '1' : '0';
    // console.log(messageType)
    let queryField = `r.username, cum.message, cum.messageType, cum.dbFileName, cum.createdAt`;
    con.query(`SELECT ${queryField} FROM channel_user_messages cum JOIN channel c ON c.id = cum.cId JOIN register r ON r.id = cum.uId WHERE cId = ? AND cum.messageType = ? ORDER BY cum.createdAt ${order} LIMIT ${skip}, ${limit}`,
        [cId, messageType], (err, result) => {
            // console.log(err);
            if (err) return res.status(501).send({ message: 'Error while changing user type in channel user' });
            res.status(200).send(result);
        })
})

app.post('/sendChannelMessage', verifyToken, (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.body.cId;
    let uId = req.body.uId;
    let message = req.body.message;
    let type = req.body.type;
    // console.log(cId, uId, type);
    con.query(`INSERT INTO channel_user_messages (cId, uId, message, messageType) VALUES (?,?,?,?)`,
        [cId, uId, message, type], (err, result) => {
            // console.log(err);
            if (err) return res.status(501).send({ message: 'Error while inserting message in to the channel' });
            res.status(200).send({ message: 'Message send Successfully' });
        })
})

// send user request on mail  
app.post('/sendUserRequest', verifyToken, async (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.body.cId;
    let uId = req.body.uId;
    let userEmail = req.body.email;
    let type = req.body.type;
    let token = uniqid();

    let isRequest = '1';
    try {

        await commonFunction.createQuery(`INSERT INTO channel_user (cId, uId, type, isRequest, token) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE token = VALUES(token)`, [cId, uId, type, isRequest, token]);
        const registerUserResult = await commonFunction.createQuery(`SELECT * FROM register WHERE id = ?`, [uId]);
        let userName = registerUserResult[0] ? registerUserResult[0].username : '';
        const channelResult = await commonFunction.createQuery(`SELECT * FROM channel WHERE id = ?`, [cId]);
        let channelName = channelResult[0] ? channelResult[0].content : '';
        // sending mail to all users for new job
        let to = userEmail;
        let subject = 'Chatroom Request';
        let acceptLink = `http://localhost:4200/chat-room-request?token=${token}&accept=true`;
        let rejectLink = `http://localhost:4200/chat-room-request?token=${token}&accept=false`;
        let html = commonFunction.generateHTML(userName, channelName, acceptLink, rejectLink);
        let mail = await mailFun.sendMail(to, subject, html);
        res.status(200).send({ message: 'User has been added to channel' });

    } catch (error) {
        console.error(error);
        res.status(501).send({ message: 'Error while adding user into channel' });
    }
})

app.post('/acceptRejectUserRequest', async (req, res) => {
    res.setHeader('content-type', 'application/json');
    let token = req.body.token;
    let accept = req.body.accept == '2' ? '2' : '0';
    try {
        let result = await commonFunction.createQuery(`SELECT * FROM channel_user WHERE isRequest = ? AND token = ?`, ["1", token]);
        if (result.length <= 0) return res.status(501).send({ message: 'Error while adding user into channel' });
        await commonFunction.createQuery(`UPDATE channel_user SET isRequest = ? WHERE token = ?`, [accept, token]);
        res.status(200).send({ message: 'User request has been completed' });

    } catch (error) {
        console.error(error);
        res.status(501).send({ message: 'Error while accepting or rejecting user request for channel' });
    }
})

app.post('/getAllUnreadFileNotification', verifyToken, async (req, res) => {
    res.setHeader('content-type', 'application/json');
    let limit = req.body.limit;
    let uId = req.body.uId;
    try {
        let result = await commonFunction.createQuery(`SELECT cum.dbFileName, cum.message FROM channel_user_messages cum WHERE cId IN (SELECT cu.cId FROM channel_user cu WHERE cu.uId = ?) AND cum.uId != 1 AND cum.messageType = ? ORDER BY cum.createdAt DESC LIMIT ?`, [uId, '1', limit]);
        res.status(200).send(result);

    } catch (error) {
        console.error(error);
        res.status(501).send({ message: 'Error while accepting or rejecting user request for channel' });
    }
})



function saveToken(data) {
    con.query(`INSERT INTO firebase_push_notification (token,uId) VALUES (?,?) ON DUPLICATE KEY UPDATE uId = VALUES(uId), token = VALUES(token)`,
        [data.token, data.uId], (err, result) => {
            if (err) console.error(err);
            // console.log(result);
        })
}

async function sendPushNotificationToTeamChannel(socketMessage) {
    try {
        // socketMessage = { message: "Hii there! what's up?", sender: 1, channelId: '62', type: 'message' }
        const tokenArr = await getTokenArr(socketMessage.channelId, socketMessage.sender);
        const senderUserData = await getUserDataById(socketMessage.sender);
        const message = {
            "notification": {
                "title": `${senderUserData ? senderUserData.username : 'Someone'} Sent Message`,
                "body": socketMessage.message,
                "icon": 'https://image.freepik.com/free-icon/world-wide-web_318-9868.jpg',
                "click_action": `/team-list/${socketMessage.channelId}`
            },
        };
        Promise.all(tokenArr.map(token => {
            return admin.messaging().sendToDevice(token.token, message)
        })).catch(error => {
            console.error("Error while send push notification throw admin");
        })
    } catch (error) {
        console.error(error, "error in send push notitfication");
    }
}

async function sendPushNotificationToIndividual(socketMessage) {
    try {
        // socketMessage = { message: "Hii there! what's up?", sender: 1, channelId: '62', type: 'message' }
        const tokenArr = await commonFunction.createQuery(`SELECT token FROM firebase_push_notification WHERE uId = ?`, [socketMessage.uId]);
        const senderUserData = await getUserDataById(socketMessage.senderId);
        const message = {
            "notification": {
                "title": `${senderUserData ? senderUserData.username : 'Someone'} Sent Message`,
                "body": socketMessage.message,
                "icon": 'https://image.freepik.com/free-icon/world-wide-web_318-9868.jpg',
                "click_action": `/group`
            },
        };
        Promise.all(tokenArr.map(token => {
            return admin.messaging().sendToDevice(token.token, message)
        })).catch(error => {
            console.error("Error while send push notification throw admin");
        })
    } catch (error) {
        console.error(error, "error in send push notitfication");
    }
}

async function getTokenArr(cId, uId) {
    return new Promise((resolve, reject) => {
        let stm = `SELECT DISTINCT fpn.token FROM firebase_push_notification fpn JOIN register r ON r.id = fpn.uId JOIN channel_user cu ON cu.uId = r.id WHERE cu.cId = ? AND r.id != ?`
        con.query(stm, [cId, uId], (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        })
    })
}

async function getUserDataById(uId) {
    return new Promise((resolve, reject) => {
        let stm = `SELECT username FROM register where id = ?`;
        con.query(stm, [uId], (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result[0]);
            }
        })
    })
}

//channel update details
app.post('/updateChannel', verifyToken, (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.body.cId;
    let content = req.body.content;
    let description = req.body.description;
    // console.log(cId, uId, type);
    con.query(`UPDATE channel SET content = ?, description = ? WHERE id = ?`,
        [content, description, cId], (err, result) => {
            // console.log(err);
            if (err) return res.status(501).send({ message: 'Error while changing channel details in channel' });
            res.status(200).send({ message: 'channel details has been changed' });
        })
})

//Guest Email With Registered Emails
app.get('/checkGuestEmail/:email', verifyToken, async (req, res) => {
    res.setHeader('content-type', 'application/json');
    let email = req.params.email;
    // console.log(email);
    try {
        let result = await commonFunction.createQuery(`SELECT * FROM register WHERE email = ?`, [email])
        // console.log(result);
        if (result.length > 0) {
            res.status(200).send({ isRegistered: true });
        } else {
            res.status(200).send({ isRegistered: false });
        }
    } catch (error) {
        console.error(error);
        res.status(501).send({ message: 'Error while Checking Guest Email Validation' });
    }
})

//Add user into requested team by token
app.post('/addUserInTeamChannelByToken', async (req, res) => {
    res.setHeader('content-type', 'application/json');
    let email = req.body.email;
    let token = req.body.token;
    let uId = req.body.uId;
    try {
        let tokenVerify = await commonFunction.createQuery(`SELECT * FROM signup_request WHERE token = ? AND receiver_email = ? AND isSuccess = ?`, [token, email, '0']);
        if (tokenVerify.length > 0) {
            let tokenUserData = tokenVerify[0];
            await commonFunction.createQuery(`INSERT INTO channel_user (cId, uId, type, isRequest, token) VALUES (?,?,?,?,?)`, [tokenUserData.cId, uId, 'normal', '2', token]);
            await commonFunction.createQuery(`UPDATE signup_request SET isSuccess = ? WHERE token = ? AND receiver_email = ?`, ['1', token, email]);
            res.status(200).send({ message: "Registration Success" });
        } else {
            res.status(200).send({ message: "Registration Success" });
        }
    } catch (error) {
        console.error(error);
        res.status(501).send({ message: 'Error while Registration' });
    }
});

// send Guest user request on mail  
app.post('/sendGuestUserRequest', verifyToken, async (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.body.cId;
    let requestBy = req.body.uId;
    let receiver_email = req.body.email;
    let token = uniqid();

    let isSuccess = '0';
    try {
        await commonFunction.createQuery(`INSERT INTO signup_request (cId, requestBy, receiver_email, token, isSuccess) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE token = VALUES(token)`, [cId, requestBy, receiver_email, token, isSuccess]);
        const registerUserResult = await commonFunction.createQuery(`SELECT * FROM register WHERE id = ?`, [requestBy]);
        let userName = registerUserResult[0] ? registerUserResult[0].username : '';
        const channelResult = await commonFunction.createQuery(`SELECT * FROM channel WHERE id = ?`, [cId]);
        let channelName = channelResult[0] ? channelResult[0].content : '';
        // sending mail to all users for new job
        let to = receiver_email;
        let subject = 'Signup Request';
        let signupLink = `http://localhost:4200/register?token=${token}`;
        let html = commonFunction.generateHTMLForSignUp(userName, channelName, signupLink);
        await mailFun.sendMail(to, subject, html);
        res.status(200).send({ message: 'Send Guest User Request Success' });

    } catch (error) {
        console.error(error);
        res.status(501).send({ message: 'Error while Guest User Request' });
    }
})

// delete team channel
app.get('/deleteTeamChannel/:cId', verifyToken, async (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.params.cId;
    try {
        await commonFunction.createQuery(`DELETE FROM channel WHERE id = ?`, [cId]);
        res.status(200).send({ message: 'Team Channel Deleted Succesfully' });

    } catch (error) {
        console.error(error);
        res.status(501).send({ message: 'Error while Deleting Team Channel' });
    }
})

// get peer id by user id
app.get('/getPeerIdByUserId/:uId', verifyToken, async (req, res) => {
    res.setHeader('content-type', 'application/json');
    let uId = req.params.uId;
    try {
        let result = await commonFunction.createQuery(`SELECT * FROM user_peers WHERE uId = ? LIMIT 1`, [uId]);
        res.status(200).send(result);

    } catch (error) {
        console.error(error);
        res.status(501).send({ message: 'Error While Fetching Data For Peer' });
    }
})

// get Peer Id By Team Channel Id
app.get('/getPeerIdByTeamId/:cId/:currentUid', verifyToken, async (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.params.cId;
    let currentUid = req.params.currentUid;
    try {
        let result = await commonFunction.createQuery(`SELECT * FROM user_peers WHERE uId IN (SELECT uId FROM channel_user WHERE cId = ? AND isRequest = '2' AND uId <> ?)`, [cId, currentUid]);
        res.status(200).send(result);

    } catch (error) {
        console.error(error);
        res.status(501).send({ message: 'Error While Fetching Data For Peer' });
    }
})

// update peer id by user id
async function upsertPeerIdByuserId(data) {
    return new Promise(async (resolve, reject) => {
        let uId = data.uId;
        let peerId = data.peerId;
        try {
            await commonFunction.createQuery(`INSERT INTO user_peers (peerId, uId) VALUES (?,?) ON DUPLICATE KEY UPDATE peerID = VALUES(peerId)`, [peerId, uId]);
            resolve({ message: 'Update Successfully' });
        } catch (error) {
            console.error(error);
            reject({ message: 'Error While Fetching Data For Peer' });
        }
    })
}

async function updateScreenSharingStatusForTeamChannel(data) {
    return new Promise(async (resolve, reject) => {
        let uId = data.uId;
        let status = data.status; // 0 for stop and 1 for start (screen sharing)
        try {
            await commonFunction.createQuery(`UPDATE channel_user SET isScreenSharingOn = ? WHERE uId = ?`, [status.toString(), uId]);
            resolve({ message: 'Update Successfully' });
        } catch (error) {
            console.error(error);
            reject({ message: 'Error While changing status for team channel user screen sharing' });
        }
    })
}

async function updateScreenSharingStatusForUser(data) {
    return new Promise(async (resolve, reject) => {
        let senderUid = data.senderUid;
        let receiverUid = data.receiverUid;
        let status = data.status; // 0 for stop and 1 for start (screen sharing)
        try {
            if (status == 1) {
                await commonFunction.createQuery(`INSERT INTO user_screen_sharing (senderUid,receiverUid, status) VALUES (?,?,?) ON DUPLICATE KEY UPDATE status = VALUES(status)`, [senderUid, receiverUid, status.toString()]);
                resolve({ message: 'Update Successfully' });
            } else {
                await commonFunction.createQuery(`DELETE FROM user_screen_sharing WHERE senderUid = ?`, [senderUid]);
                resolve({ message: 'Delete Successfully' });
            }
        } catch (error) {
            console.error(error);
            reject({ message: 'Error While changing status for team channel user screen sharing' });
        }
    })
}

app.get('/getSenderPeerIdByTeamChannelId/:cId', verifyToken, async (req, res) => {
    res.setHeader('content-type', 'application/json');
    let cId = req.params.cId;
    try {
        let result = await commonFunction.createQuery(`SELECT * FROM user_peers WHERE uId IN (SELECT uId FROM channel_user WHERE cId = ? AND isScreenSharingOn = '1') LIMIT 1`, [cId]);
        res.status(200).send(result);

    } catch (error) {
        console.error(error);
        res.status(501).send({ message: 'Error While Fetching Data For Peer' });
    }
})

app.get('/getCompanyDetailByCompanySlag/:slag', async (req, res) => {
    res.setHeader('content-type', 'application/json');
    let slag = req.params.slag;
    try {
        let result = await commonFunction.createQuery(`SELECT * FROM company_register WHERE company_slag  = ?`, [slag]);
        if (result.length > 0)
            res.status(200).send(result);
        else
            res.status(200).send(null);
    } catch (error) {
        console.error(error);
        res.status(501).send({ message: 'Error While Fetching Data For Peer' });
    }
})

// app.get('/deleteComany', async (req, res) => {
//     res.setHeader('content-type', 'application/json');
//     try {
//         await commonFunction.createQuery(`DELETE FROM company_register WHERE company_name  = ?`, ['Big Bucket']);
//         res.status(200).send({ message: 'Deleted' });
//     } catch (error) {
//         console.error(error);
//         res.status(501).send({ message: 'Error While Fetching Data For Peer' });
//     }
// })

// session token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImNvbXBhbnlJZCI6NSwiaWF0IjoxNTkzMTg4MzMzfQ.t0A2Ak8gtzhHjZOuWYnKwWZYNTrMJAUmMYc1udS6ARI