

let generateHTML = (name, channelName, acceptLink, rejectLink) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
       <style>
        .btn {
          border: none;
          color: white;
          padding: 15px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          cursor: pointer;
        }

        .btn-primary {
          background-color: rgb(70, 119, 209);
        }

        .btn-danger {
          background-color: rgb(230, 23, 23);
        }

        a:link {
          color: white;
        }

        a .btn:visited {
          color: white;
        }

        .text-white {
          color: white;
        }
    </style>
    </head>
    <body>
      <p>Dear ${name}</p>
      <p>Chatroom request For <b>${channelName}</b></p>
      <p>
        Your approval is requested in the following button. By clicking on the below button you're making your selection.

        If you are ready to make a selection now, use the appropriate button below.
      </p>
      <!-- <br /> -->
      <div style="text-align: center;">
        <a class="btn btn-primary" href="${acceptLink}" target="_blank">
        <span class="text-white">Accept<span>
        </a>
        <br /> <br />
        <a class="btn btn-danger" href="${rejectLink}" target="_blank">
        <span class="text-white">Reject<span></a>
      </div>
      <br />

      If you have any questions, please don't hesitate to contact me or replying to this mail.

      <br />
      <br />
      Thank you.
      <br />
      Trillup, Team.
    </body>
    </html>
  `
}

let generateHTMLForSignUp = (name, channelName, singupLink) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
       <style>
        .btn {
          border: none;
          color: white;
          padding: 15px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          cursor: pointer;
        }

        .btn-primary {
          background-color: rgb(70, 119, 209);
        }

        .btn-danger {
          background-color: rgb(230, 23, 23);
        }

        a:link {
          color: white;
        }

        a .btn:visited {
          color: white;
        }

        .text-white {
          color: white;
        }
    </style>
    </head>
    <body>
      <p>Dear</p>
      <p>Signup request For <b>${channelName}</b> By <b>${name}</b></p>
      <p>
        Signup with Trillup. By clicking on the below button you will be redirected to signup page and by filling your information you can register yourself with Trillup.

        If you are ready to make a selection now, use the below button.
      </p>
      <!-- <br /> -->
      <div style="text-align: center;">
        <a class="btn btn-primary" href="${singupLink}" target="_blank">
        <span class="text-white">Singup<span>
        </a>
      </div>
      <br />

      If you have any questions, please don't hesitate to contact me or replying to this mail.

      <br />
      <br />
      Thank you.
      <br />
      Trillup, Team.
    </body>
    </html>
  `
}

let createQuery = (stm, paramsArr) => {
  return new Promise((resolve, reject) => {
    con.query(stm, paramsArr, (error, result) => {
      if (error) reject(error);
      resolve(result);
    })
  })
}

module.exports = {
  generateHTML,
  generateHTMLForSignUp,
  createQuery
}


// return `
//   <p>Hello, ${name}</p>
//   <p>Chatroom request:</p>
//   <p>Please accept request, <a href="#">click here.</a></p>
//   <br><p>Thanks,</p>
//   <p>Trill Up</p>
// `