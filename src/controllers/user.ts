import express, {Router} from "express"


const userRoute = Router();

const login = async (req: any, res: any)=>{
    return res.json({
        "page" : "login page"
    });
};

const logout = async (req: any, res: any)=>{
    return res.json({
        "page" : "logout page"
    });
};

export {login, logout}