const express = require("express");
const _router = express.Router();
const con = require("../config/db");
const dotenv = require("dotenv");
const commonFunction = require('./helper/commonFunction');

_router.get('/getSenderPeerIdByTeamChannelId/:cId', async (req, res) => {
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

// get peer id by user id
_router.get('/getPeerIdByUserId/:uId', async (req, res) => {
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
_router.get('/getPeerIdByTeamId/:cId/:currentUid', async (req, res) => {
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


module.exports = _router;