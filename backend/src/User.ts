export class User {
    recentEnterTime = Date.now();  // 用户最近一次登录时间(创建对象时默认初始化)
    recentLeaveTime = null;  // 用户最近一次离开时间
    constructor(public userName: string, public status: number) {
        this.userName = userName;  // 用户名
        this.status = status;  // 用户状态(1-在线, 0-离线)
    }
}

