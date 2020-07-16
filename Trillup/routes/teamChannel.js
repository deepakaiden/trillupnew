const express = require("express");
const _router = express.Router();
const con = require("../config/db");
const dotenv = require("dotenv");
const multer = require('multer');
const commonFunction = require('./helper/commonFunction');
const mailFun = require('./helper/mail');


_router.get('/getTeamChannelUser/:cId', (req, res) => {
  res.setHeader('content-type', 'application/json');
  let cId = req.params.cId;
  con.query(`SELECT cId, uId, cu.type, c.type as chntype, username, email, cu.isRequest FROM channel_user cu JOIN channel c ON c.id = cu.cId JOIN register r ON r.id = cu.uId WHERE cId = ? and cu.isRequest = '2'`, [cId], (error, result) => {
    // console.error(error);
    if (error) return res.status(501).send({ message: "Error While Fetching channel users" });
    return res.status(200).send(result);
  })
})

_router.get('/getChannelById/:cId/:uId', (req, res) => {
  res.setHeader('content-type', 'application/json');
  let cId = req.params.cId;
  let uId = req.params.uId;
  con.query(`SELECT * FROM channel WHERE id IN (SELECT cId FROM channel_user WHERE cId = ? AND uId = ? AND isRequest = ?)`, [cId, uId, '2'], (error, result) => {
    // console.error(error);
    if (error) return res.status(501).send({ message: "Error While Fetching channel users" });
    return res.status(200).send(result);
  })
})

_router.get('/getResgiterUserForTeamUserListing/:cId', (req, res) => {
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

_router.get('/getCurrentUserTeamChannelDetail/:cId/:uId', (req, res) => {
  res.setHeader('content-type', 'application/json');
  let cId = req.params.cId;
  let uId = req.params.uId;
  con.query(`SELECT cId, uId, type, username, email FROM channel_user cu JOIN channel c ON c.id = cu.cId JOIN register r ON r.id = cu.uId WHERE cu.cId = ? AND cu.uId = ?`, [cId, uId], (error, result) => {
    // console.error(error);
    if (error) return res.status(501).send({ message: "Error While Fetching channel users" });
    return res.status(200).send(result);
  })
})

_router.post('/addUserIntoTeamChannel', (req, res) => {
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

// send user request on mail  
_router.post('/sendUserRequest', async (req, res) => {
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

// send Guest user request on mail  
_router.post('/sendGuestUserRequest', async (req, res) => {
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

_router.post('/deleteUserIntoTeamChannel', (req, res) => {
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

_router.post('/changeUserType', (req, res) => {
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

_router.post('/getChannelMessages', (req, res) => {
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

_router.post('/sendChannelMessage', (req, res) => {
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

// get all shared-files details
_router.get("/uploadfiles", (req, res) => {
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

//channel update details
_router.post('/updateChannel', (req, res) => {
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

_router.post('/acceptRejectUserRequest', async (req, res) => {
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

_router.post('/getAllUnreadFileNotification', async (req, res) => {
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

//Guest Email With Registered Emails
_router.get('/checkGuestEmail/:email', async (req, res) => {
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

// delete team channel
_router.get('/deleteTeamChannel/:cId', async (req, res) => {
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

//Team Channel file upload 
const filesStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${__dirname}/upload/userfile`);
  },
  filename: function (req, file, cb) {
    let mimetype = file.originalname.split('.');
    cb(null, file.fieldname + '_' + Date.now() + '.' + mimetype[1])
  }
})
var uploadUserFile = multer({
  storage: filesStorage
}).single("userFile");

_router.post('/uploadFile', (req, res) => {
  uploadUserFile(req, res, (err) => {
    // console.log(err);
    if (err) {
      return res.send({ msg: err });
    } else {
      let insertData = JSON.parse(req.body.otherData);
      // console.log(insertData, req.file);

      let cId = insertData.cId;
      let uId = insertData.uId;
      let message = req.file.originalname;
      let messageType = "1";
      let originalName = req.file.filename;

      con.query(`INSERT INTO channel_user_messages (cId, uId, message, messageType, dbFileName) VALUES (?,?,?,?,?)`, [cId, uId, message, messageType, originalName], (err, result) => {
        // console.log(err);
        if (err) return res.status(501).send({ message: 'Error while adding user into channel_user_messages' });
        res.status(200).send({ message: 'User File has been uploaded to channel_user_messages' });
      })
    }
  })
});

module.exports = _router;