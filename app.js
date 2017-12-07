// 配置 appid， appkey等
const host = "https://baas.qingful.com/2.0/class/",
      appid = "142002573481",
      appkey = "4e6d33f0-d665-11e7-b313-0d63e19f4828",
      dev = "true";

// 请求封装
wx.BaaS = {
  getRequestOptions: function (options) {
    const url = host + options.url;
    const header = {
      "x-qingful-appid": appid,
      "x-qingful-appkey": appkey,
      "x-qingful-dev": dev,
      "Authorization": wx.getStorageSync("Authorization"),
      "Content-Type": "application/json"
    };
    return Object.assign(options, { url, header });
  },

  request: function (options) {
    return wx.request(this.getRequestOptions(options));
  },

  fetch: function (url, options = {}) {
    options.url = url;
    return new Promise((resolve, reject) => {
      options.success = res => {
        resolve(res);
      };
      options.fail = res => {
        reject(res);
      };
      this.request(options);
    });
  }
};




