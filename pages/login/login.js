// pages/login/login.js
const phoneReg = /^[1][3,4,5,7,8][0-9]{9}$/;
const pwdReg = /^[a-zA-Z]\w{5,17}$/;

Page({
  onLoad: function (options) {
    wx.clearStorageSync('Authorization');
  },

  // 登录数据正则验证及提交
  signIn: function (e) {
    const phone = e.detail.value.phone,
          password = e.detail.value.password;
    if (phone == '' || password == '') {
      this.alert('请输入完整！')
    } else if (!phoneReg.test(phone)) {
      this.alert('手机号码格式不正确！')
    } else if (!pwdReg.test(password)) {
      this.alert('密码格式不正确！')
    } else {
      const data = {
        phone: phone,
        password: password
      };
      // 提交数据
      this.postLoginData(data)
    }
  },

  // 提交登陆数据
  postLoginData: function (data) {
    wx.BaaS.fetch(
      'public/table/user/fetch?where=phone,' + data.phone + '&where=password,' + data.password,
    )
      .then(res => {
        console.log(res)
        const authorization = res.data.data;
        if (authorization) {
          wx.setStorageSync('Authorization', authorization);
          wx.redirectTo({
            url: '../index/index',
          })
        } else {
          this.alert('手机号或密码错误！')
        }
      });
  },

  // 错误弹窗
  alert: function (text) {
    wx.showModal({
      title: text,
      showCancel: false
    })
  }
})