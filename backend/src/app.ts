import express from "express";

import TestRouter from "@routes/TestRouter";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
