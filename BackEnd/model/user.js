

const db = require("./databaseConfig");
var config = require('../config.js');
var jwt = require('jsonwebtoken');

const userDB = {

  resetFailedAttempts: function (userid, callback) {
    var conn = db.getConnection();
    conn.connect(function (err) {
      if (err) {
        conn.end();
        return callback(err, null);
      } else {
        const sql = 'DELETE FROM failed_logins WHERE userid = ?';
        conn.query(sql, [userid], function (err, results) {
          conn.end();
          if (err) {
            return callback(err, null);
          }
          return callback(null, results);
        });
      }
    });
  },

  logFailedAttempt: function (userid, callback) {
    var conn = db.getConnection();
    conn.connect(function (err) {
      if (err) {
        conn.end();
        return callback(err, null);
      } else {
        const sqlCheck = 'SELECT * FROM failed_logins WHERE userid = ?';
        conn.query(sqlCheck, [userid], function (err, results) {
          if (err) {
            conn.end();
            return callback(err, null);
          }
          if (results.length > 0) {
            // Checks if existing record exists, if yes, update the record
            const sqlUpdate = 'UPDATE failed_logins SET failed_attempt = failed_attempt + 1, timestamp = NOW() WHERE userid = ?';
            conn.query(sqlUpdate, [userid], function (err, results) {
              conn.end();
              if (err) {
                return callback(err, null);
              }
              return callback(null, results);
            });
          } else {
            // Chjecks if existing record exists, if no, insert a new record
            const sqlInsert = 'INSERT INTO failed_logins (userid, failed_attempt, timestamp) VALUES (?, 1, NOW())';
            conn.query(sqlInsert, [userid], function (err, results) {
              conn.end();
              if (err) {
                return callback(err, null);
              }
              return callback(null, results);
            });
          }
        });
      }
    });
  },

  checkFailedAttempts: function (userid, callback) {
    var conn = db.getConnection();
    conn.connect(function (err) {
      if (err) {
        conn.end();
        return callback(err, null);
      } else {
        const threshold = 3; // Maximum amount of failed attempts
        const timeoutPeriod = 1; // timeout period in minutes, real scenario will not be 1 minute
        const sql = `
          SELECT 
            failed_attempt, 
            TIMESTAMPDIFF(MINUTE, timestamp, NOW()) AS minutes_since_last_attempt 
          FROM failed_logins 
          WHERE userid = ?`;

        conn.query(sql, [userid], function (err, results) {
          if (err) {
            conn.end();
            return callback(err, null);
          }
          if (results.length > 0) {
            const { failed_attempt, minutes_since_last_attempt } = results[0];
            const isOverLimit = failed_attempt >= threshold;
            const isTimeoutElapsed = minutes_since_last_attempt >= timeoutPeriod;

            if (isOverLimit && !isTimeoutElapsed) {
              conn.end();
              return callback(null, true);
            } else if (isOverLimit && isTimeoutElapsed) {
              const resetSql = 'UPDATE failed_logins SET failed_attempt = 0 WHERE userid = ?';
              conn.query(resetSql, [userid], function (err) {
                conn.end();
                if (err) {
                  return callback(err);
                }
                return callback(null, false);
              });
            } else {
              conn.end();
              return callback(null, false);
            }
          } else {
            conn.end();
            return callback(null, false);
          }
        });
      }
    });
  },

  //Add new user to database
  addNewUser: (username, email, contact, password, type, profile_pic_url, callback) => {
    //Connects
    var dbConn = db.getConnection();
    dbConn.connect(function (err) {
      //Return error
      if (err) {
        return callback(err, null)
      } else {
        // Password Regex
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
          dbConn.end();
          // For error message
          return callback("Password must meet requirements of 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character.", null);
        }
        //Sql query
        dbConn.query(`
      insert into user 
      (username, email, contact, password, type, profile_pic_url) values
      (?, ?, ?, ?, ?, ?);`, [username, email, contact, password, type, profile_pic_url], function (err, results) {
          //End connection
          dbConn.end();
          if (err)
            console.log(err)
          return callback(err, results)
        });
      }
    });
  },

  //Get all user
  getAllUser: callback => {

    //Connects
    var dbConn = db.getConnection();
    dbConn.connect(function (err) {

      //Return error
      if (err) {

        return callback(err, null)

      } else {

        //Sql query
        dbConn.query(`
            SELECT 
            u.userid, 
            u.username, 
            u.email, 
            u.contact, 
            u.type, 
            u.profile_pic_url, 
            u.created_at 
            FROM user u;`, [], function (err, results) {

          //End connection
          dbConn.end();

          if (err)
            console.log(err)

          return callback(err, results)
        });

      }

    });

  },

  //Get user by userid
  getUser: (userid, callback) => {

    //Connects
    var dbConn = db.getConnection();
    dbConn.connect(function (err) {

      //Return error
      if (err) {

        return callback(err, null)

      } else {

        //Sql query
        dbConn.query(`
        SELECT 
        u.userid, 
        u.username, 
        u.email, 
        u.contact, 
        u.type, 
        u.profile_pic_url, 
        u.created_at 
        FROM user u 
        WHERE u.userid = ?;`, [userid], function (err, results) {

          //End connection
          dbConn.end();

          if (err)
            console.log(err)

          return callback(err, results)
        });

      }

    });

  },

  //Update user 
  updateUser: (username, email, contact, password, type, profile_pic_url, userid, oldPassword, callback) => {

    //Connects
    var dbConn = db.getConnection();
    dbConn.connect(function (err) {

      //Return error
      if (err) {
        console.log(err);
        return callback(err, null)
      } else {

        //Sql query
        dbConn.query(`
        Update user set 
        username=?, 
        email=?, 
        contact=?, 
        password=?, 
        type=?, 
        profile_pic_url=?
        where userid=? and password=?;`, [username, email, contact, password, type, profile_pic_url, userid, oldPassword], function (err, results) {
          console.log(err);
          //End connection
          dbConn.end();

          if (err)
            console.log(err)

          return callback(err, results)
        });

      }

    });

  },

  loginUser: function (username, password, callback) {
    var conn = db.getConnection();

    conn.connect((err) => {
      if (err) {
        console.log(err);
        return callback(err, null);
      } else {
        let sql = 'SELECT * FROM user WHERE username=?';

        conn.query(sql, [username], (err, result) => {
          if (err) {
            console.log("Err: " + err);
            conn.end();
            return callback(err, null);
          } else {
            if (result.length == 1) {
              // Check if the number of failed attempts is over the limit
              this.checkFailedAttempts(result[0].userid, (err, isOverLimit) => {
                if (err) {
                  conn.end();
                  return callback(err, null);
                }
                if (isOverLimit) {
                  conn.end();
                  return callback(new Error("Too many failed attempts. Try again later."), null);
                }

                // If not over the limit, proceed with password verification
                if (result[0].password === password) {
                  // Reset failed attempts because of successful login
                  this.resetFailedAttempts(result[0].userid, (err) => {
                    if (err) {
                      console.log(err); // Log the error, but continue with login process
                    }
                  });

                  let token = jwt.sign({
                    userid: result[0].userid,
                    type: result[0].type,
                  }, config.key, { expiresIn: 86400 }); // expires in 24 hrs

                  conn.end();
                  return callback(null, result, token);
                } else {
                  // Log failed attempt
                  this.logFailedAttempt(result[0].userid, (err) => {
                    if (err) {
                      console.log(err); // Log the error
                    }
                  });

                  conn.end();
                  return callback(new Error("Invalid password"), null);
                }
              });
            } else {
              conn.end();
              return callback(new Error("Username not found"), null);
            }
          }
        });
      }
    });
  }
};

module.exports = userDB;