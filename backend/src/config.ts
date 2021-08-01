import { BinaryToTextEncoding } from "crypto";
import { Options } from "sequelize/types";
import dotenv from "dotenv";
dotenv.config();

const sequelizeOptions: Options = {
  // 数据库类别
  dialect: "sqlite",
  // 修复 vercel 找不到 sqlite3 的问题：
  // https://github.com/vercel/ncc/issues/345#issuecomment-487404520
  dialectModule: require("sqlite3"),
  dialectOptions: {
    // 字符集
    charset: "utf8mb4",
  },
  storage: "./database.sqlite3",
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_general_ci",
  },
};

const devConfig = {
  port: 8005,
  host: "http://localhost/",
  cryptoConfig: {
    // 每次分段加密的字符串最大长度（优先度高于cryptCount字段）
    onceCryptLength: 5,
    // 一次加密至多分段几次加密
    cryptCount: 5,
    // 返回值格式
    // 如果提供了 encoding，则返回字符串，否则返回 Buffer
    // 可选值：['hex', 'Base64', ...]
    digest: "hex" as BinaryToTextEncoding,
    // 用于cipher对称加密生成密钥的密码
    secret: process.env.ACCESS_TOKEN_SECRET as string,
  },
  dataBaseConfig: {
    // options
    options: sequelizeOptions,

    // 时区
    timezone: "+08:00",
  },
  upyunConfig: {
    operator: process.env.UPYUN_OPERATOR as string,
    secret: process.env.UPYUN_SECRET as string,
    bucket: process.env.UPYUN_BUCKET as string,
    domainName: process.env.UPYUN_DOMAINNAME as string,
    imgPath: "bd7/image/",
    videoPath: "bd7/video/",
  },
  // 12个小时
  tokenExpiredTime: "12h",
};

const prodConfig = {
  ...devConfig,
  // TODO: 生产模式需要使用不同的数据库表
};
export default process.env.NODE_ENV === "production" ? prodConfig : devConfig;
