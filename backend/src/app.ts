import express from "express";
import path from "path";

import TestRouter from "@routes/TestRouter";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "../../frontend/dist")));

/**
 * JWT中间件
 */
// TODO: 后期改为登录验证
// app.use(checkJWT);
// app.use(checkValidUser);

/**
 * 业务路由
 */
app.use("/api/test", TestRouter);

export default app;
