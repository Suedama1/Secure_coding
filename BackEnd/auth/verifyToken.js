var jwt = require('jsonwebtoken');
var config = require('../config');
const customLog = require('./customLog');

function verifyToken(req, res, next) {
    console.log(req.headers);

    var token = req.headers['authorization']; // Retrieve authorization header's content
    console.log(token);

    if (!token || !token.includes('Bearer')) { // Process the token
        let logMessage = `Unauthorized Access Attempt - No or invalid token provided`;
        customLog(req, res, logMessage); // Log the unauthorized attempt

        res.status(403);
        return res.send({ auth: 'false', message: 'Not authorized!' });
    } else {
        token = token.split('Bearer ')[1]; // Obtain the token's value
        //console.log(token);
        jwt.verify(token, config.key, function (err, decoded) { // Verify token
            if (err) {
                let logMessage = `Unauthorized Access Attempt - Failed to authenticate token`;
                customLog(req, res, logMessage); // Log the unauthorized attempt

                res.status(403);
                return res.json({ auth: false, message: 'Not authorized!' });
            } else {
                console.log(decoded)
                req.userid = decoded.userid; // Decode the userid and store in req for use
                req.type = decoded.type; // Decode the role and store in req for use
                next();
            }
        });
    }
}

module.exports = verifyToken;