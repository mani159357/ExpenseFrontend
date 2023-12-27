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
                                    <script>
                                        function formsubmitted(e){
                                            e.preventDefault();
                                            console.log('called')
                                        }
                                    </script>

                                    <form action="/password/updatepassword/${id}" method="get">
                                        <label for="newpassword">Enter New password</label>
                                        <input name="newpassword" type="password" required></input>
                                        <button>reset password</button>
                                    </form>
                                </html>`
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