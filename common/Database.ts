const mongoose = require('mongoose');
require('dotenv').config();


export const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
            // useNewUrlParser: true, // Use the new URL parser
            // useUnifiedTopology: true, // Use the new Server Discovery and Monitoring engine
        });
        console.log("Connected to database.");
    }
    catch (ex) {
        console.error("Error connecting to database: ", ex);
    }
}

export const db = mongoose;