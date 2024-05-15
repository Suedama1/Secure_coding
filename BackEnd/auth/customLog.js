const fs = require('fs');
const path = require('path');

function formatToIdealFormat(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return {
        date: `${day}-${month}-${year}`,
        time: `${hours}:${minutes}:${seconds}`
    };
}
function customLog(req, res, message) {
    const logFilePath = path.join(__dirname, '../controller/detailed_logs.csv');
    const { date, time } = formatToIdealFormat(new Date());

    let remoteAddr = 'N/A';
    if (req.ip) {
        remoteAddr = req.ip;
    } else {
        remoteAddr = 'N/A'
    }

    let method = req.method;

    let url = req.originalUrl;

    let status = 'N/A';
    if (res.statusCode) {
        status = res.statusCode;
    } else {
        status = 'N/A';
    }

    let contentLength = 'N/A';

    if (res.get('content-length')) {
        contentLength = res.get('content-length');
    } else {
        contentLength = 'N/A';
    }

    let responseTime = 'N/A'; // Assuming you have middleware that sets this
    if (res.get('X-Response-Time')) {
        responseTime = res.get('X-Response-Time');
    } else {
        responseTime = 'N/A';
    }

    let auth = 'N/A';
    if (req.headers.authorization) {
        auth = req.headers.authorization;
    } else {
        auth = 'N/A';
    }

    let host = req.headers.host;
    let userAgent = req.headers['user-agent'];

    const logEntry = `Date: ${date}, Time: ${time}, Remote Address: ${remoteAddr}, Method: ${method}, URL: ${url}, Status: ${status}, Content-Length: ${contentLength}, Response Time: ${responseTime}, Authorization: ${auth}, Host: ${host}, User-Agent: ${userAgent}, Message: ${message}\n`;

    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Logging failed', err);
        }
    });
}

module.exports = customLog;