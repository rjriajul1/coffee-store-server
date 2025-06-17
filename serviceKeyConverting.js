const fs = require('fs')
const jsonData = fs.readFileSync('./coffee-store-auth-admin-service-key.json')
const base64 = Buffer.from(jsonData, 'utf8').toString('base64')

