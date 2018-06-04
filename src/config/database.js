const mongoose = require('mongoose')
module.exports = mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:1211968Dxa@ds237770.mlab.com:37770/heroku_xgvlx834')

