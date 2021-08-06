import dotenv from "dotenv";
dotenv.config();


const devConfig = {
  port: 8005,
  host: "http://localhost/",
};

const prodConfig = {
  ...devConfig,
  // TODO: 生产模式需要使用不同的数据库表
};
export default process.env.NODE_ENV === "production" ? prodConfig : devConfig;
