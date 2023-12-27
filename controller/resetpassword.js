const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const Forgotpassword = require('../models/forgotpassword');

require('dotenv').config();

const sib = require('sib-api-v3-sdk');
const client = sib.ApiClient.instance
const apiKey = client.authentications['api-key'];

apiKey.apiKey = process.env.API_KEY;
const tranEmailApi = new sib.TransactionalEmailsApi();

const forgotpassword = async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ where: { email: email } });
        if (user) {

            const resetToken = generateResetToken(user.id);
            const sender = {
                email: 'manikanthbolem2@gmail.com',
                name: 'Mani'
            }
            const receivers = [{
                email: email,
            }];
            const newUuid = uuid.v4();
            await user.createForgotpassword({ id: newUuid, active: true })
                .catch(err => {
                    throw new Error(err)
                })

            const resetLink = `http://${process.env.IP}:${process.env.PORT}/password/resetpassword/${newUuid}?token=${resetToken}`;
            const subject = "Password Reset Request";
            const textContent = `Click the following link to reset your password: ${resetLink}`;

            tranEmailApi.sendTransacEmail({
                sender,
                to: receivers,
                subject,
                textContent,
            })
                .then(response => {
                    return res.status(202).json({ message: 'Link to reset password sent to your mail ', sucess: true })
                })
                .catch(err => { throw new Error(err) });

        } else {
            throw new Error('User doesnt exist')
        }
    } catch (err) {
        return res.json({ message: err, sucess: false });
    }

}

function generateResetToken(id) {
    return jwt.sign({ userId: id }, 'resetkey');;
}

const resetpassword = (req, res) => {
    const id = req.params.id;
    Forgotpassword.findOne({ where: { id } }).then(forgotpasswordrequest => {
        if (forgotpasswordrequest) {
            forgotpasswordrequest.update({ active: false });
            res.status(200).send(`<html>

            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
            
                    form {
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        max-width: 400px;
                        width: 100%;
                    }
            
                    label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: bold;
                    }
            
                    input {
                        width: 100%;
                        padding: 8px;
                        margin-bottom: 16px;
                        box-sizing: border-box;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                    }
            
                    button {
                        background-color: #4caf50;
                        color: #fff;
                        padding: 10px 15px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                    }
            
                    button:hover {
                        background-color: #45a049;
                    }
                </style>
            </head>
            
            <body>
                <form action="/password/updatepassword/${id}" method="get" onsubmit="formsubmitted(event)">
                    <label for="newpassword">Enter New password</label>
                    <input name="newpassword" type="password" required>
                    <button>Reset Password</button>
                </form>
            
                <script>
                    function formsubmitted(e) {
                        e.preventDefault();
                        console.log('called');
                    }
                </script>
            </body>
            
            </html>
            `
            )
            res.end()

        }
    })
}

const updatepassword = (req, res) => {

    try {
        const { newpassword } = req.query;
        const { resetpasswordid } = req.params;
        Forgotpassword.findOne({ where: { id: resetpasswordid } }).then(resetpasswordrequest => {
            User.findOne({ where: { id: resetpasswordrequest.userId } }).then(user => {
                if (user) {
                    //encrypt the password

                    const saltRounds = 10;
                    bcrypt.genSalt(saltRounds, function (err, salt) {
                        if (err) {
                            console.log(err);
                            throw new Error(err);
                        }
                        bcrypt.hash(newpassword, salt, function (err, hash) {
                            // Store hash in your password DB.
                            if (err) {
                                console.log(err);
                                throw new Error(err);
                            }
                            user.update({ password: hash }).then(() => {
                                res.status(201).json({ message: 'Successfuly update the new password' })
                            })
                        });
                    });
                } else {
                    return res.status(404).json({ error: 'No user Exists', success: false })
                }
            })
        })
    } catch (error) {
        return res.status(403).json({ error, success: false })
    }

}


module.exports = {
    forgotpassword,
    updatepassword,
    resetpassword
}