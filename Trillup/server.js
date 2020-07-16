const express = require("express");
let app = express();
let bodyparser = require("body-parser");
const cors = require("cors");
const expressJwt = require('express-jwt');
const dotenv = require("dotenv");
const commonFunction = require('./routes/helper/commonFunction');
var admin = require('firebase-admin');
var uniqid = require("uniqid");
const http = require("http");
const con = require('./config/db');

dotenv.config();

// Routes
const userRouts = require("./routes/user");
const audiocallRoutes = require("./routes/audiocall");
const peerjsRoutes = require("./routes/peer");
const teamChannelRoutes = require("./routes/teamChannel");
// const userRouts1=require("./routes/audiocall")

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://push-notification-testin-fb795.firebaseio.com"
});

const PORT = process.env.PORT || 3000;

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(cors({
    origin: "http://localhost:4200",
    credentials: true
}));
app.use('/upload', express.static('upload'));

app.use("/user", userRouts);
app.use("/audiocall", audiocallRoutes);
app.use("/peerjsUser", peerjsRoutes);
app.use("/teamChannel", teamChannelRoutes);

// app.use(expressJwt({ secret: process.env.JWT_SECRET_KEY }).unless({ path: ["/user/register", "/user/login", "/user/request-reset-password", "/user/valid-password-token", "/user/new-password"] }));

const channelFileUploadPath = 'upload/userfile/';

// An array to store current online users
const onlineUsers = [];
var onlineUsersById = [];
var onlineUserPushNotificationTokenArr = [];
const users = {};

const server = http.createServer(app);
const io = require("socket.io")(server);

server.listen(PORT, () => console.log("Server started at http://localhost:" + PORT));

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

function saveToken(data) {
    con.query(`INSERT INTO firebase_push_notification (token,uId) VALUES (?,?) ON DUPLICATE KEY UPDATE uId = VALUES(uId), token = VALUES(token)`,
        [data.token, data.uId], (err, result) => {
            if (err) console.error(err);
            // console.log(result);
        })
}

async function getRegisterIdByEmail(email) {
    return commonFunction.createQuery(`SELECT id FROM register WHERE email = ?`, [email]);
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
            console.error(error);
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
            console.error(error);
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