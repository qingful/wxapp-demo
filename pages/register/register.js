// pages/register/register.js
const phoneReg = /^[1][3,4,5,7,8][0-9]{9}$/;
const pwdReg = /^[a-zA-Z]\w{5,17}$/;

Page({
  // 注册数据正则验证及提交
  signUp: function (e) {
    const phone = e.detail.value.phone,
          password = e.detail.value.password,
          pwdRepeate = e.detail.value.pwdRepeate;
    if (phone == '' || password == '' || pwdRepeate == '') {
      this.alert('请输入完整！')
    } else if (!phoneReg.test(phone)) {
      this.alert('手机号码格式不正确！')
    } else if (!pwdReg.test(password)) {
      this.alert('密码格式不正确！')
    } else if (password !== pwdRepeate) {
      this.alert('两次密码不一致！')
    } else {
      const data = {
        phone: phone,
        password: password
      };
      // 提交数据
      this.postRegisterData(data)
    }
  },

  // 提交注册数据
  postRegisterData: function (data) {
    wx.BaaS.fetch(
      'public/table/user/add', {
        method: 'POST',
        data: data
      }
    )
      .then(res => {
        const sucess = res.data.data;
        if (sucess) {
          wx.redirectTo({
            url: '../login/login',
          })
        } else {
          this.alert('注册失败！请检查您的网络！')
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