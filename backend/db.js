import pkg from "pg";
import { Pool } from "pg";
import dotenv from "dotenv";
import express from "express";
const app= express();
dotenv.config();

const pool= new Pool({
    user:process.env.DB_USER,
    host:process.env.DB_HOST,
    database:process.env.DB_DATABASE,
    password:process.env.DB_PASSWORD,
    port:Number(process.env.DB_PORT)
})
pool.on("connect",()=>{
    console.log("Connection established")
});


export default pool;
