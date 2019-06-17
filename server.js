require('dotenv').config();
//const express = require("express");
//const path = require("path");
import { GraphQLServer, PubSub } from 'graphql-yoga';
import { startDB, models } from './db';
import Query from './resolvers/Query';
import Mutation from './resolvers/Mutation';
import Subscription from './resolvers/Subscription';
import { getFile,  uploadFile } from './utils/upload';
import session from 'express-session';
import ms from 'ms';


const cors = require("cors");
const mongoose = require("mongoose");
const { GridFSBucket } = require('mongodb');

const db = startDB({ URL: process.env.MONGO });
const pubsub = new PubSub()
mongoose.set('useFindAndModify', false);

mongoose.connection.once("open", () => {
  
const GridFS = new GridFSBucket(mongoose.connection.db, {bucketName: 'uploadPDFs',chunkSizeBytes: 255 * 1024 });
const context = (req) => ({
    req: req.request,
    db,
    models,
    utils: {
      getFile,
      uploadFile
    },
    GridFS,
    pubsub
});

const server = new GraphQLServer({
    typeDefs: './schema.graphql',
    resolvers: {
      Query,
      Mutation,
      Subscription
    },
    context,
});
//server.express.use(cors());
server.express.use(session({
    name: 'jackson',  
    secret: `some-random-secret-here`,
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: ms('1d'),
    },
}));

server.express.set('trust proxy', true)

const opts = {
    port: process.env.PORT || 4000,
    cors: {
      credentials: true,
      origin: ['http://localhost:3000','http://localhost:3001']
    }
};

server.start(opts, 
() => console.log(`Server is running on http://localhost:${opts.port}`));

})