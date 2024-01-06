import cors from 'cors'
require('dotenv').config();
const host_port = process.env.PORT


const corsConfig = {
    origin: "https://adayinthelife.vercel.app" , 
    methods: 'POST, GET, PUT, DELETE, HEAD, PATCH, OPTIONS',
    credentials: true,
};
const applyCors = cors(corsConfig);
export default applyCors;

