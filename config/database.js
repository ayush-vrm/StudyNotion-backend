const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () =>{
    mongoose.connect(process.env.MONGODB_URL)
    .then(()=> console.log("DB Connected SUccessfully"))
    .catch((error) =>{
        console.log("DB connection failed");
        console.error(error);
        process.exit(1);
    })
}