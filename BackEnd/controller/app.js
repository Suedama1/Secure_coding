var express = require('express');
var bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
var cors = require('cors');
const multer = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/product')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        let extArray = file.mimetype.split("/");
        let extension = extArray[extArray.length - 1];
        cb(null, file.fieldname + '-' + uniqueSuffix + "." + extension)
    }
})
const upload = multer({ storage: storage })

var userDB = require('../model/user');
const categoryDB = require('../model/category');
const productDB = require('../model/product');
const reviewDB = require('../model/review');
const discountDB = require('../model/discount');
const productImagesDB = require('../model/productimages');
var verifyToken = require('../auth/verifyToken.js');
const orderDB = require('../model/orders');
const customLog = require('../auth/customLog.js');


const morgan = require('morgan');

var app = express();
app.options('*', cors());
app.use(cors());
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(urlencodedParser);
app.use(bodyParser.json()); //Chunking for json POST

//Middleware
app.use(express.static(path.join(__dirname, '../public/')));

// Timestamp, event details (GET, POST, PUT), user information (userid), status code, system changes (Password change), product add, category add, api calls


function formatToIdealFormat(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}-${month}-${year}, ${hours}:${minutes}:${seconds}`;
}

morgan.token('customDate', function (req, res) {
    return formatToIdealFormat(new Date());
});

morgan.token('userid', function (req, res) {
    if (req.userid) {
        return req.userid;
    } else {
        return 'N/A';
    }
});

morgan.token('auth', function (req, res) {
    return req.headers.authorization || 'N/A';
});

morgan.token('host', function (req, res) {
    return req.headers.host;
});


// function customLog(message) {
//     const logFilePath = path.join(__dirname, 'detailed_logs.csv');
//     const timestamp = formatToIdealFormat(new Date());
//     const logEntry = `${timestamp} - ${message}\n`;

//     fs.appendFile(logFilePath, logEntry, (err) => {
//         if (err) {
//             console.error('Logging failed', err);
//         }
//     });
// }

// function customLog(req, res, message) {
//     const logFilePath = path.join(__dirname, 'detailed_logs.csv');
//     const timestamp = formatToIdealFormat(new Date());
//     const remoteAddr = req.ip || 'N/A';
//     const method = req.method;
//     const url = req.originalUrl;
//     const status = res.statusCode;
//     const contentLength = res.get('content-length') || 'N/A';
//     const responseTime = res.get('X-Response-Time') || 'N/A'; // Assuming you have middleware that sets this
//     const auth = req.headers.authorization || 'N/A';
//     const host = req.headers.host;
//     const userAgent = req.headers['user-agent'];

//     const logEntry = `${timestamp}, Remote Address: ${remoteAddr}, Method: ${method}, URL: ${url}, Status: ${status}, Content-Length: ${contentLength}, Response Time: ${responseTime}, Authorization: ${auth}, Host: ${host}, User-Agent: ${userAgent}, Message: ${message}\n`;

//     fs.appendFile(logFilePath, logEntry, (err) => {
//         if (err) {
//             console.error('Logging failed', err);
//         }
//     });
// }

// function customLog(req, res, message) {
//     const logFilePath = path.join(__dirname, 'detailed_logs.csv');
//     const timestamp = formatToIdealFormat(new Date());

//     let remoteAddr = 'N/A';
//     if (req.ip) {
//         remoteAddr = req.ip;
//     } else {
//         remoteAddr = 'N/A'
//     }

//     let method = req.method;

//     let url = req.originalUrl;

//     let status = 'N/A';
//     if (res.statusCode) {
//         status = res.statusCode;
//     } else {
//         status = 'N/A';
//     }

//     let contentLength = 'N/A';

//     if (res.get('content-length')) {
//         contentLength = res.get('content-length');
//     } else {
//         contentLength = 'N/A';
//     }

//     let responseTime = 'N/A'; // Assuming you have middleware that sets this
//     if (res.get('X-Response-Time')) {
//         responseTime = res.get('X-Response-Time');
//     } else {
//         responseTime = 'N/A';
//     }

//     let auth = 'N/A';
//     if (req.headers.authorization) {
//         auth = req.headers.authorization;
//     } else {
//         auth = 'N/A';
//     }

//     let host = req.headers.host;
//     let userAgent = req.headers['user-agent'];

//     const logEntry = `${timestamp}, Remote Address: ${remoteAddr}, Method: ${method}, URL: ${url}, Status: ${status}, Content-Length: ${contentLength}, Response Time: ${responseTime}, Authorization: ${auth}, Host: ${host}, User-Agent: ${userAgent}, Message: ${message}\n`;

//     fs.appendFile(logFilePath, logEntry, (err) => {
//         if (err) {
//             console.error('Logging failed', err);
//         }
//     });
// }


// app.use(morgan(':remote-addr :userid - :customDate - :method :url :status :res[content-length] - :response-time ms - :auth - :host - :user-agent'));

// Morgan logging setup
app.use(morgan((tokens, req, res) => {
    // Each token is separated by a newline for clarity
    return [
        'Remote Address: ' + tokens['remote-addr'](req, res),
        'User ID: ' + tokens['userid'](req, res),
        'Date: ' + tokens['customDate'](req, res),
        'HTTP Method: ' + tokens['method'](req, res),
        'URL: ' + tokens['url'](req, res),
        'Status: ' + tokens['status'](req, res),
        'Content Length: ' + tokens['res'](req, res, 'content-length'),
        'Response Time: ' + tokens['response-time'](req, res) + ' ms',
        'Authorization: ' + tokens['auth'](req, res),
        'Host: ' + tokens['host'](req, res),
        'User Agent: ' + tokens['user-agent'](req, res)
    ].join('\n');
}));


//Get if user is logged in with correct token
app.post('/user/isloggedin', verifyToken, (req, res) => {
    if (req.body.userid == req.userid && req.body.type == req.type)
        res.status(200).json({
            userid: req.userid,
            type: req.type,
        })
    else
        res.status(401).json({ Message: "Not logged in" })
});

//Get order
app.get('/order/:userid', verifyToken, (req, res) => {

    orderDB.getOrder(req.userid, (err, results) => {
        if (err)
            res.status(500).json({ result: "Internal Error" })

        else {
            res.status(200).send(results);
        }

    })
});

//Add Order
app.post('/order', verifyToken, (req, res) => {

    const { cart, total } = req.body;

    orderDB.addOrder(req.userid, cart, total, (err, results) => {

        if (err) {
            if (err?.message)
                res.status(400).json({ message: err?.message })

            else
                res.status(500).json({ message: "Internal Error" })
        }

        //No error, response with productid
        else
            res.status(201).json({ orderid: results.insertId })

    })

})

//Update product
app.put('/product/:productid', verifyToken, (req, res) => {

    const { name, description, categoryid, brand, price } = req.body;
    const productid = req.params.productid;
    const userid = req.userid;

    productDB.updateProduct(name, description, categoryid, brand, price, req.params.productid, (err, results) => {

        if (err) {
            let logMessage = `Update Product Failed - UserID: ${userid}, ProductID: ${productid}, Error: ${err.message}`;
            customLog(req, res, logMessage);
            res.status(500).json({ result: "Internal Error" });
        }

        //No error, response with productid
        else {
            if (results.affectedRows < 1) {
                let logMessage = `Update Product No Change - UserID: ${userid}, ProductID: ${productid}`
                customLog(req, res, logMessage);
                res.status(500).json({ message: "Nothing was updated! Product might not exist" })
            } else {
                let logMessage = `Update Product Successful - UserID: ${userid}, ProductID: ${productid}`
                customLog(req, res, logMessage);
                res.status(201).json({ affectedRows: results.affectedRows });
            }
        }
    });
});


//Delete Review
app.delete('/review/:reviewid', verifyToken, (req, res) => {

    const reviewid = req.params.reviewid;
    const userid = req.userid;

    reviewDB.deleteReview(req.params.reviewid, req.userid, (err, results) => {
        if (err) {
            let logMessage = `Delete Review Failed - UserID: ${userid}, ReviewID: ${reviewid}, Error: ${err.message}`;
            customLog(req, res, logMessage);
            res.status(500).json({ result: "Internal Error" })
        } else {
            if (results.affectedRows < 1) {
                let logMessage = `Delete Review No Change - UserID: ${userid}, ReviewID: ${reviewid}`;
                customLog(req, res, logMessage);
                res.status(500).json({ result: "Internal Error" })
            } else {
                let logMessage = `Delete Review Successful - UserID: ${userid}, ReviewID: ${reviewid}`;
                customLog(req, res, logMessage);
                res.status(204).end();
            }
        }
    })
})

//get all product by brand
app.get('/product/brand/:brand', (req, res) => {

    productDB.getAllProductByBrand(req.params.brand, (err, results) => {

        if (err)
            res.status(500).json({ result: "Internal Error" })

        //No error, response with product info
        else {
            res.status(200).json(results)
        }
    })

});

//get all product
app.get('/product', (req, res) => {

    productDB.getAllProduct((err, results) => {

        if (err)
            res.status(500).json({ result: "Internal Error" })

        //No error, response with product info
        else {
            res.status(200).json(results)

        }
    })
});

//login
app.post('/user/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    userDB.loginUser(username, password, function (err, result, token) {
        if (err) {
            let logMessage = `Failed login attempt - username: ${username}, Error ${err.message}`;
            customLog(req, res, logMessage);

            if (err.message.includes("Too many failed attempts")) {
                res.status(429).send(err.message);
            } else {
                res.status(401).send("Wrong Login Credentials Provided");
            }
            return; // Ensure no further processing after sending a response
        }

        customLog(req, res, `Successful login - username: ${username}`)

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        delete result[0]['password']; // Clear the password
        res.json({ success: true, UserData: JSON.stringify(result), token: token, status: 'You are successfully logged in!' });
    });
});



//Api no. 1 Endpoint: POST /users/ | Add new user
app.post('/users', (req, res) => {
    var { username, email, contact, password, profile_pic_url } = req.body;

    if (!profile_pic_url) {
        profile_pic_url = "";
    }
    userDB.addNewUser(username, email, contact, password, "Customer", profile_pic_url, (err, results) => {

        if (err) {
            let logMessage = `Add User Failed - Username: ${username}, Email: ${email}, Error: ${err.message}`;
            customLog(req, res, logMessage);
            // Check if error is due to duplicate username or email
            if (err.code === "ER_DUP_ENTRY") {
                res.status(422).json({ message: `The new username OR new email provided already exists.` });
            }
            // Check if error is due to password not meeting requirements
            else if (err === "Password must meet requirements of 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character.") {
                res.status(400).json({ message: "Password must meet requirements of 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character." });
            }
            // Otherwise, it's an unknown error
            else {
                res.status(500).json({ message: "Internal Error" });
            }
        } else {
            let logMessage = `Add User Successful - UserID: ${results.insertId}, Username: ${username}`
            customLog(req, res, logMessage);
            // No error, response with userid
            res.status(201).json({ userid: results.insertId, username: username });
        }
    });
});


//Api no. 2 Endpoint: GET /users/ | Get all user
app.get('/users', (req, res) => {

    userDB.getAllUser((err, results) => {

        if (err)
            res.status(500).json({ result: "Internal Error" })

        //No error, response with all user info
        else {
            res.status(200).json(results)

        }
    })

});

//Api no. 3 Endpoint: GET /users/:id/ | Get user by userid
app.get('/users/:id', (req, res) => {

    userDB.getUser(req.params.id, (err, results) => {

        if (err)
            res.status(500).json({ result: "Internal Error" })

        //No error, response with user info
        else {
            res.status(200).json(results[0])

        }
    })
});

//Api no. 4 Endpoint: PUT /users/:id/ | Update info user by userid
app.put('/users/:id', verifyToken, (req, res) => {
    const { username, email, contact, password, profile_pic_url, oldpassword } = req.body;

    userDB.updateUser(username, email, contact, password, req.type, profile_pic_url, req.userid, oldpassword, (err, results) => {

        if (err) {

            let logMessage = `Update User Failed - UserID: ${req.params.id}, Error: ${err.message}`;
            customLog(req, res, logMessage);
            //Check if name or email is dup"
            if (err.code == "ER_DUP_ENTRY")
                res.status(422).json({ message: `The new username OR new email provided already exists.` })

            //Otherwise unknown error
            else
                res.status(500).json({ result: "Internal Error" })

        }
        else {
            console.log(results)
            if (results.affectedRows < 1) {
                console.log(err);
                let logMessage = `Update User Failed - UserID: ${req.params.id}, Message: Incorrect Password`;
                customLog(req, res, logMessage);
                res.status(400).json({ message: "Incorrect Password" })
            } else {

                let logMessage = `Update User Successful - UserID: ${req.params.id}`;
                customLog(req, res, logMessage);
                res.status(204).end();
            }
        }

    })
})

//CATEGORY

//Api no. 5 Endpoint: POST /category | Add new category
app.post('/category', verifyToken, (req, res) => {
    if (req.type.toLowerCase() != "admin") {
        return res.status(403).json({ message: 'Not authorized!' });
    }
    const { category, description } = req.body;

    categoryDB.addNewCategory(category, description, (err, results) => {

        if (err) {
            let logMessage = `Add Category Failed - Category: ${category}, Error: ${err.message}`;
            customLog(req, res, logMessage);
            //Check if name or email is dup
            if (err.code == "ER_DUP_ENTRY")
                res.status(422).json({ message: `The category name provided already exists` })

            //Otherwise unknown error
            else
                res.status(500).json({ result: "Internal Error" })

        }

        //No error, response with userid
        else {
            let logMessage = `Add Category Successful - Category: ${category}`;
            customLog(req, res, logMessage);
            res.status(204).end();
        };
    })

})

//Api no. 6 Endpoint: GET /category | Get all category
app.get('/category', (req, res) => {

    categoryDB.getAllCategory((err, results) => {

        if (err)
            res.status(500).json({ result: "Internal Error" })

        //No error, response with all user info
        else {
            res.status(200).json(results)

        }
    })

});

//PRODUCT

//Api no. 7 Endpoint: POST /product/ | Add new product
app.post('/product', verifyToken, (req, res) => {
    if (req.type.toLowerCase() != "admin") {
        return res.status(403).json({ message: 'Not authorized!' });
    }
    const { name, description, categoryid, brand, price } = req.body;

    productDB.addNewProduct(name, description, categoryid, brand, price, (err, results) => {

        if (err) {
            let logMessage = `Add Product Failed - Name: ${name}, Error: ${err.message}`;
            customLog(req, res, logMessage);
            res.status(500).json({ result: "Internal Error" })
        }
        //No error, response with productid
        else {
            let logMessage = `Add Product Successful - Name: ${name}, Product ID: ${results.insertId}`;
            customLog(req, res, logMessage);
            res.status(201).json({ productid: results.insertId })
        }
    })

})

//Api no. 8 GET /product/:id | Get product info from productid 
app.get('/product/:id', (req, res) => {

    productDB.getProduct(req.params.id, (err, results) => {

        if (err)
            res.status(500).json({ result: "Internal Error" })

        //No error, response with product info
        else {
            res.status(200).json(results)

        }
    })

});

//Api no. 9 Endpoint: DELETE /product/:id/ | Delete product from productid 
app.delete('/product/:id', verifyToken, (req, res) => {

    const productId = req.params.id;


    if (req.type.toLowerCase() != "admin") {
        return res.status(403).json({ message: 'Not authorized!' });
    }

    productDB.deleteProduct(req.params.id, (err, results) => {

        if (err) {
            let logMessage = `Delete Product Failed - Product ID: ${productId}, Error: ${err.message}`;
            customLog(req, res, logMessage);
            res.status(500).json({ result: "Internal Error" })

        } else {
            let logMessage = `Delete Product Successful - Product ID: ${productId}`;
            customLog(req, res, logMessage);
            res.status(204).end();
        }
    })

});

//REVIEW

//Api no. 10 Endpoint: POST /product/:id/review/ | Add review
app.post('/product/:id/review/', verifyToken, (req, res) => {
    const { userid, rating, review } = req.body;
    const productId = req.params.id

    reviewDB.addReview(userid, rating, review, req.params.id, (err, results) => {

        if (err) {
            let logMessage = `Add Review Failed - Product ID: ${productId}, User ID: ${userid}, Error: ${err.message}`;
            customLog(req, res, logMessage);
            res.status(500).json({ result: "Internal Error" })
        }
        //No error, response with reviewid
        else {
            let logMessage = `Add Review Successful - Product ID: ${productId}, User ID: ${userid}, Review ID: ${results.insertId}`;
            customLog(req, res, logMessage);
            res.status(201).json({ reviewid: results.insertId })
        }
    })

})

//Api no. 11 Endpoint: GET /product/:id/reviews | Get all review from productid
app.get('/product/:id/reviews', (req, res) => {

    reviewDB.getProductReview(req.params.id, (err, results) => {

        if (err)
            res.status(500).json({ result: "Internal Error" })

        //No error, response with all user info
        else
            res.status(200).json(results)

    })

});


//BONUS REQUIREMENT DISCOUNT

//Api no. 15 Endpoint: POST /product/:id/discount | Add new discount
app.post('/discount/:productid', verifyToken, (req, res) => {


    if (req.type.toLowerCase() != "admin") res.status(403).json({ message: 'Not authorized!' });
    if (req.type.toLowerCase() != "admin") return

    const { discount_percentage, start_at, end_at, name, description } = req.body;
    const productid = req.params.productid;

    if (!req.type || req.type.toLowerCase() != "admin") {
        let logMessage = `Unauthorized Discount Attempt - Product ID: ${productid}, User ID: ${req.userid}`;
        customLog(req, res, logMessage);
        res.status(403).json({ message: 'Not authorized!' });
        return;
    }


    discountDB.addNewDiscount(productid, discount_percentage, start_at, end_at, name, description, (err, results) => {

        if (err) {
            let logMessage = `Add Discount Failed - Product ID: ${productid}, Error: ${err.message}`;
            customLog(req, res, logMessage);
            if (err.errno == 1292 && err.sqlMessage.startsWith("Incorrect datetime"))
                res.status(400).json({ message: "Invalid Time" })
            else
                res.status(500).json({ message: "Internal Error" })
        }

        else {
            let logMessage = `Add Discount Successful - Product ID: ${productid}, Discount ID: ${results.insertId}`;
            customLog(req, res, logMessage);
            res.status(201).json({ discountid: results.insertId })
        }
    })

})

//Api no. 16 Endpoint: GET /discount/ | Get all discount
app.get('/discount', (req, res) => {

    discountDB.getAllDiscount((err, results) => {

        if (err)
            res.status(500).json({ result: "Internal Error" })

        else {
            res.status(200).json(results)


        }
    })

});

//Api no. 17 Endpoint: GET /product/:id/discounts | Get user by userid
app.get('/discount/:id/', (req, res) => {

    discountDB.getProductDiscount(req.params.id, (err, results) => {

        if (err)
            res.status(500).json({ result: "Internal Error" })

        else
            res.status(200).json(results)

    })
});


//BONUS REQUIREMENT PRODUCT IMAGE

//Api no. 13 Endpoint: POST /product/:id/image  | Upload product image 
app.post('/product/:id/image', verifyToken, upload.single('image'), function (req, res) {
    if (req.type.toLowerCase() != "admin") {
        return res.status(403).json({ message: 'Not authorized!' });
    }
    //Check if there is file
    if (req.file == undefined) {
        let logMessage = `Image Upload Failed - Product ID: ${req.params.id}, Error: No file given`;
        customLog(req, res, logMessage);
        res.status(422).json({ message: "No file given" })
    } else {
        const { filename: imageName, mimetype: imageType, path: imagePath, size: imageSize } = req.file;
        const productid = req.params.id;
        const imageExtension = imageType.split("/")[imageType.split("/").length - 1];
        const oneMegabyte = 1000000;

        //Check if file is more than 1mb
        if (imageSize > oneMegabyte) {

            let logMessage = `Image Upload Failed - Product ID: ${productid}, Error: File size too large`;
            customLog(req, res, logMessage);
            //Remove file if file size too large
            fs.unlink(imagePath, (err) => { if (err) console.error(err) })

            res.status(413).json({ message: "File size too large" })

            //Check if the image type is correct
        } else if (!(imageExtension == "jpeg" || imageExtension == "png" || imageExtension == "jpg")) {
            let logMessage = `Image Upload Failed - Product ID: ${productid}, Error: Invalid file type`;
            customLog(req, res, logMessage);
            //remove file if file type is not jpeg/png/jpg
            fs.unlink(imagePath, (err) => { if (err) console.error(err) })

            res.status(415).json({ message: "Invalid file type" })

        } else
            // Add image 
            productImagesDB.addImage(productid, imageName, imageType, imagePath.slice(7, imagePath.length), (err, results) => {

                if (err) {

                    let logMessage = `Image Upload Failed - Product ID: ${productid}, Error: ${err.message}`;
                    customLog(req, res, logMessage);
                    //Remove picture if error occured when updating sql
                    fs.unlink(imagePath, (err) => { if (err) console.error(err) })
                    res.status(500).json({ result: "Internal Error" })
                }

                else {
                    let logMessage = `Image Uploaded Successfully - Product ID: ${productid}, Image Name: ${imageName}`;
                    customLog(req, res, logMessage);
                    res.status(200).json({ affectedRows: results.affectedRows });
                }
            })
    }

});

//Api no. 14 Endpoint: GET /product/:id/image | Get product image by productid
app.get('/product/:id/image', (req, res) => {

    productImagesDB.getProductImage(req.params.id, (err, results) => {

        if (err)
            res.status(500).json({ result: "Internal Error" })

        else
            res.status(200).json(results)

    })
});

//Api no. 20 Endpoint: GET /product/cheapest/:categoryid | Get 3 cheapest product by category
app.get('/product/cheapest/:categoryid', (req, res) => {

    productDB.get3CheapestFromCategory(req.params.categoryid, (err, results) => {

        if (err)
            res.status(500).json({ result: "Internal Error" })

        else {
            if (results.length > 0)
                res.status(200).json({
                    product: results,
                    cheapestPrice: results[0].price
                })
            else
                res.status(200).json({ message: "No product" })
        }
    })
});

// Api no.idk Endpoint: GET /adminiPanel | Backend Validation for adminPanel
app.get('/adminPanel', verifyToken, (req, res) => {
    if (req.type.toLowerCase() != "admin") {
        return res.status(403).json({ message: 'Not authorized!' });
    }
    // User is an admin, send the admin panel content
    res.sendFile(path.join(__dirname, 'adminPanel.html'));
});

app.use((req, res, next) => {
    res.status(404).send('404 Not found');
});

module.exports = app;
// module.exports = customLog;