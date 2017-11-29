const version = "2.0";
const host = "baas.qingful.com";
const appid = "";
const appkey = "";

// 检测浏览器环境
if (window) {
    window.BaaS = {};
    BaaS.version = version;
    BaaS.host = host;

    module.exports = BaaS;
}

// 检测微信小程序环境
if (wx) {
    wx.BaaS = {};
    wx.BaaS.appid = appid;
    wx.BaaS.appkey = appkey;
    wx.BaaS.version = version;
    wx.BaaS.host = host;
    wx.BaaS.secure = true;
    wx.BaaS.dev = false;
    wx.BaaS.openSettingStatus = true;
    wx.BaaS.noAuthorizationRequestOptions = [];
    wx.BaaS.getRequestOptions = function(options) {
        let url = options.url;
        let header = options.header || {};
        let protocol = wx.BaaS.secure ? "https://" : "http://";

        if (
            options.url.indexOf("https://") !== 0 &&
            options.url.indexOf("http://") !== 0
        ) {
            url = `${protocol}${wx.BaaS.host}${options.url}`;
        } else {
            if (options.url.indexOf(`${protocol}${wx.BaaS.host}`) !== 0) {
                url = `${protocol}${wx.BaaS.host}`;
                header.Proxy = options.url;
            }
        }

        header = Object.assign({
                "x-qingful-appid": wx.BaaS.appid,
                "x-qingful-appkey": wx.BaaS.appkey,
                "x-qingful-dev": wx.BaaS.dev,
                Authorization: wx.getStorageSync("Authorization"),
                "Content-Type": "application/json"
            },
            header
        );

        return Object.assign(options, { url, header });
    };
    wx.BaaS.connectSocket = function(options) {
        let protocol = wx.BaaS.secure ? "wss://" : "ws://";

        if (options.url.indexOf(`${protocol}${wx.BaaS.host}`) !== 0) {
            options = Object.assign(options, {
                url: `${protocol}${wx.BaaS.host}?Proxy=${encodeURIComponent(
                    options.url
                )}`
            });
        }

        return wx.connectSocket(options);
    };
    wx.BaaS.request = function(options) {
        return wx.request(wx.BaaS.getRequestOptions(options));
    };
    wx.BaaS.login = function(cb) {
        const loginHandle = () => {
            wx.login({
                success: res => {
                    const code = res.code;
                    if (code) {
                        wx.getUserInfo({
                            success: res => {
                                const data = {
                                    code: code,
                                    encryptedData: res.encryptedData,
                                    iv: res.iv
                                };
                                wx.BaaS.request({
                                    url: "https://api.qingful.com/api/public/wxa_login",
                                    method: "POST",
                                    data: data,
                                    success: res => {
                                        if (
                                            res &&
                                            res.data.code &&
                                            res.data.data.token
                                        ) {
                                            wx.setStorageSync(
                                                "Authorization",
                                                res.data.data.token
                                            );
                                            typeof cb == "function" && cb(res);
                                        } else {
                                            wx.showModal({
                                                content: res.data.data,
                                                showCancel: false
                                            });
                                            return res;
                                        }
                                    },
                                    fail: res => {
                                        console.error(
                                            "wx.BaaS.login request Fail" +
                                            res.errMsg
                                        );
                                    }
                                });
                            },
                            fail: res => {
                                console.error(
                                    "wx.BaaS.login wx.getUserInfo Fail" +
                                    res.errMsg
                                );
                            }
                        });
                    } else {
                        console.error(
                            "wx.BaaS.login wx.login Fail" + res.errMsg
                        );
                    }
                }
            });
        };
        const openSetting = () => {
            wx.openSetting({
                success: res => {
                    if (res.authSetting["scope.userInfo"]) {
                        loginHandle();
                    } else {
                        wx.showModal({
                            content: "必须允许微信授权登录",
                            showCancel: false,
                            success: res => {
                                openSetting();
                            }
                        });
                    }
                }
            });
        };

        wx.getSetting({
            success(res) {
                if (!res["scope.userInfo"]) {
                    wx.authorize({
                        scope: "scope.userInfo",
                        success: res => {
                            loginHandle();
                        },
                        fail: res => {
                            if (wx.BaaS.openSettingStatus) {
                                wx.BaaS.openSettingStatus = false;
                                openSetting();
                            } else {
                                loginHandle();
                            }
                        }
                    });
                } else {
                    loginHandle();
                }
            }
        });
    };
    wx.BaaS.fetch = function(url, options = {}) {
        options.url = url;
        return new Promise((resolve, reject) => {
            options.success = res => {
                // if (res.statusCode == 401) {
                //     wx.BaaS.noAuthorizationRequestOptions.push(options);
                //     wx.BaaS.login(() => {
                //         let length =
                //             wx.BaaS.noAuthorizationRequestOptions.length;
                //         for (let i = 0; i < length; i++) {
                //             wx.BaaS.request(
                //                 wx.BaaS.noAuthorizationRequestOptions.pop()
                //             );
                //         }
                //     });
                // } else {
                    resolve(res);
                // }
            };
            options.fail = res => {
                reject(res);
            };
            wx.BaaS.request(options);
        });
    };
    wx.BaaS.upload = function(options) {
        return wx.uploadFile(wx.BaaS.getRequestOptions(options));
    };
    wx.BaaS.debug = function(error) {
        return new Promise((resolve, reject) => {
            wx.getSystemInfo({
                success: systemInfo => {
                    wx.getNetworkType({
                        success: networkType => {
                            const err = error.split("\n");
                            resolve({
                                name: err[2],
                                type: err[0],
                                message: err[1],
                                info: error,
                                device: systemInfo.model,
                                system: systemInfo.system,
                                remark: `微信版本：${systemInfo.version},SDK版本：${systemInfo.SDKVersion},屏幕：宽：${systemInfo.screenWidth} 高：${systemInfo.screenHeight} 像素比：${systemInfo.pixelRatio},品牌：${systemInfo.brand},语言：${systemInfo.language}`
                            });
                        },
                        fail: res => {
                            console.error(
                                "wx.BaaS.debug getNetworkType Fail" + res.errMsg
                            );
                            reject(res);
                        }
                    });
                },
                fail: res => {
                    console.error(
                        "wx.BaaS.debug getSystemInfo Fail" + res.errMsg
                    );
                    reject(res);
                }
            });
        });
    };

    App({
        onError: function(error) {
            wx.BaaS
                .debug(error)
                .then(errInfo => {
                    const reg = new RegExp(
                        "TypeError: wx.(\\w*) is not a function"
                    );
                    if (errInfo.name.match(reg)) {
                        wx.showModal({
                            title: "提示",
                            content: "当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。"
                        });
                        return;
                    }

                    let protocol = wx.BaaS.secure ? "https://" : "http://";
                    wx.BaaS.fetch(`${protocol}${wx.BaaS.host}/2.0/debug/add`, {
                        method: "POST",
                        data: errInfo
                    });
                })
                .catch(error => {
                    console.error(error);
                });
        }
    });

    module.exports = wx.BaaS;
}