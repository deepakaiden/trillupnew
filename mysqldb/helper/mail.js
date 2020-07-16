const nodemailer = require("nodemailer");

let sendMail = (to, subject, html) => {
    return new Promise((resolve, reject) => {
        // sending mail to reply users query
        var transporter = nodemailer.createTransport({
            // host: 'smtp.gmail.com',
            host: 'smtpout.secureserver.net',
            port: 587,
            secure: false,
            // requireTLS: true,
            auth: {
                user: 'support@trillup.com',
                pass: 'Rayies@123#'
                // user: 'trilluptesting@gmail.com',
                // pass: '9409111133'
            },
        })

        var mailOptions = {
            from: `Trillup Team <support@trillup.com>`,
            to: to,
            subject: subject,
            html: html,
            // attachments: attachments,
        };

        transporter.sendMail(mailOptions, async function (error, info) {
            if (error) {
                console.log(error, "error ------------------");
                reject("There is error in Retrive Data for mail sending:- " + error);
            } else {
                console.log('Email sent: ' + info.response);
                resolve("Mail Sent!!!");
            }
        });
    });
};

module.exports = {
    sendMail
}
