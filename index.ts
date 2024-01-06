import {Request, Response} from 'express';
import express from 'express';
import User from './models/User';
import Blog from './models/Blog';
import { connectToDB } from './common/Database';
import { UserInfo } from './models/UserInfo';
import multer from 'multer';
import fs from 'fs';
import applyCors from './config/Cors';
import cors from 'cors';
require('dotenv').config();

const port = process.env.SERVER_PORT
const salt = process.env.HASH_SALT
const secret = process.env.SECRET_KEY;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
// const upload = multer({dest: 'uploads/'});

class BlogAPI {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.setupRoutes();
    }

    private setupRoutes() {
        connectToDB();
        this.app.use(applyCors);
        // this.app.use(
        //     cors({
        //       origin: "*",
        //   }));
        this.app.use(express.json());
        this.app.use(cookieParser());
        // Bind the method to the class instance
        this.app.post('/register', this.registerUser.bind(this));
        this.app.post('/login', this.loginUser.bind(this));
        this.app.post('/logout', this.logoutUser.bind(this));
        this.app.post('/write', this.writeNewBlog.bind(this));

        this.app.get('/', this.getDefaultPage.bind(this));
        this.app.get('/profile', applyCors, this.getProfile.bind(this));
        this.app.get('/get-blogs', applyCors, this.getBlogs.bind(this));
        this.app.get('/latest-blog', this.getLatestBlog.bind(this));
        this.app.get('/get-blogs/:id', this.getSpecificBlog.bind(this));
        this.app.use((req, res, next) => {
            console.log('Request received:', req.method, req.url);
            next();
        });

        this.app.listen(port, () => {
            console.log(`Server is running on port: ${port}`)
        })
    }

    private async getDefaultPage(req: Request, res: Response) {
        res.json("Server online");
    }

    private async registerUser(req: Request, res: Response) {
        try {
            const {username, password} = req.body;

            const userData = await User.create({username, password: bcrypt.hashSync(password, salt)});
            res.json(userData);
        }
        catch (ex) {
            console.error("Error while registering: ", ex);
            res.status(500).json({error: "Interval server error"});
        }
    };

    private async loginUser(req: Request, res: Response) {
        const {username, password} = req.body;
        const userID = await User.findOne({username});

        if (!userID) {
            // User with the provided username was not found
            return res.status(400).json('Wrong credentials');
        }

        const pass = bcrypt.compareSync(password, userID.password);

        if(pass) {
            // Logged in
            jwt.sign({username, id:userID._id}, secret, {}, (ex: Error | null, token?:string) => {
                if (ex) throw ex;
                res.cookie('token', token).json({
                    id: userID._id,
                    username
                });
            });

        }
        else {
            res.status(400).json('Wrong credentials');
        }
    /**
     * Request Handling:
        The code starts by extracting the username and password from the req.body, 
        which presumably contains the user's login credentials.
        
     * Database Query:
        It then attempts to find a user in the database using the User.findOne({ username }) query. 
        This query looks for a user with the provided username.

     * Password Verification:
        If a user with the given username is found, the code compares the provided password 
        with the hashed password stored in the database using bcrypt.compareSync(). 
        If the passwords match, it means the user has provided the correct password.

     * Token Generation:
        Upon successful password verification, the code generates a JWT token using the jwt.sign() function. 
        This token typically contains information about the user (e.g., username and id) and 
        is signed with a secret key (secret). If token generation is successful, it returns the token in the callback.

     * Response Handling:
        If token generation is successful (token is defined), 
        it sets a cookie named 'token' with the generated token and 
        sends a JSON response with the message 'ok', indicating a successful login.
        If token generation fails (token is undefined), it sends a 500 Internal Server Error
        response with the message 'Error while generating token'.

     * Error Handling:
        If the provided username does not exist in the database, 
        it sends a 400 Bad Request response with the message 'User not found'.
        If the provided password does not match the stored password, 
        it sends a 400 Bad Request response with the message 'Wrong credentials'.
        This code provides a basic authentication mechanism where a user can log in with valid credentials, 
        and if successful, they receive a JWT token that can be used for subsequent authenticated requests. 
        The error handling ensures that appropriate responses are sent in case of various scenarios, 
        including user not found, incorrect credentials, and token generation errors.
     */
    }

    private getProfile(req: Request, res: Response) {
        const {token} = req.cookies
        jwt.verify(token, secret, {}, (err: Error, info: UserInfo) => {
            if(err) throw err;
            res.json(info);
        });
        res.json(req.cookies);
    }

    private logoutUser(req: Request, res: Response) {
        res.cookie('token', '').json('ok');
    }

    private async writeNewBlog(req: Request, res: Response) {
        let newPath = '';
        try {
            if(req.file) {
                const {originalname, path} = req.file;
                // Split path name into two, and create new path using originalname and file path
                const splitPath = path.split('/');
                newPath = splitPath[0] + '/' + originalname;
                await fs.promises.rename(path, newPath);
            }

            const {token} = req.cookies
            jwt.verify(token, secret, {}, async (err: Error, info: UserInfo) => {
                if(err) throw err;
                let {title, author, date, content} = req.body;
                if (!author) {
                    author = "Anonoymous";
                }
                const blogData = await Blog.create({ title, author, date, content, newPath, user:info.id})
                return res.json(blogData)
            });
            
        }
        catch (ex) {
            console.error('Error posting blog:', ex);
            return res.status(500).json({ message: 'Internal server error' });
        }
        /**
         * Add this line if TS is having issues:
              npm install express @types/express multer @types/multer
         */
    }

    private async getBlogs(req: Request, res: Response) {
        return res.json(await Blog.find()
        .limit(50));
    }

    private async getLatestBlog(req: Request, res: Response) {
        try {
          const latestBlog = await Blog.findOne({}).sort({ createdAt: -1 });
        //   res.json(latestBlog);
          if (!latestBlog) {
            // Handle the case where there are no blogs
            return res.status(404).json({ message: 'No blogs found' });
          }
          return res.json(latestBlog);
        } catch (ex) {
          // Handle any errors that occur during the query
          console.error('Error retrieving latest blog:', ex);
          return res.status(500).json({ message: 'Internal server error' });
        }
      }

      private async getSpecificBlog(req: Request, res: Response) {
          const {id} = req.params;
          try {
            const specificBlog = await Blog.findById(id);
            if (!specificBlog) {
                return res.status(404).json({message: `Cannot find blog with ID: ${id}`})
            }
            res.json(specificBlog);
          }
          catch (ex){
              console.error(`Error retrieving blog ${id}: `, ex)
              return res.status(500).json({message: 'Cannot find blog with id, server error'});
          }
      }

      private async deleteBlog(req: Request, res: Response) {
          const remove = await Blog.delete({})
      }



}

const startSession = new BlogAPI();
