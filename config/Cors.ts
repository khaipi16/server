import cors from 'cors'
require('dotenv').config();
const host_port = process.env.HOST_PORT


const corsConfig = {
    // origin: "https://client-khaipi16s-projects.vercel.app" , 
    origin: "http://localhost:3000", 
    methods: 'POST, GET, PUT, DELETE, HEAD, PATCH, OPTIONS',
    credentials: true,
};
const applyCors = cors(corsConfig);
export default applyCors;

