//index.js
//获取应用实例
Page({
  data: {
    todos: [],
    filterTodos: [],
    newTodo: '',
    allCompleted: [],
    touchStartTime: 0,
    touchEndTime: 0,
    lastTapTime: 0,
    filtered: 'all',
    activeTodos: []
  },

  onLoad: function () {
    // 判断是否已登陆
    const authorization = wx.getStorageSync('Authorization');
    if (authorization) {
      this.getTodos()
    } else {
      wx.reLaunch({
        url: '../login/login',
      })
    }
  },

  // 获取数据
  getTodos: function () {
    wx.BaaS.fetch(
      '/2.0/class/home/table/todos/fetchAll?whereIn=status,0,1',
    ).then(res => {
      let todos = res.data.data;
      const filtered = this.data.filtered;
      todos.forEach(function (todo) {
        todo.edit = false;
      });
      const filterTodos = this.filters[filtered](todos);
      const activeTodos = this.filters.active(todos);
      this.setData({
        todos: todos,
        filterTodos: filterTodos,
        activeTodos: activeTodos
      });
    })
  },

  // 添加/修改 提交数据
  editTodo: function (data) {
    wx.BaaS.fetch(
      '/2.0/class/home/table/todos/add', {
        method: 'POST',
        data: data
      }
    ).then(res => {
        this.getTodos();
    })
  },

  // 删除数据  提交数据
  del: function (id) {
    wx.BaaS.fetch(
      '/2.0/class/home/table/todos/delete?whereIn=id,' + id,
    ).then(res => {
      this.getTodos()
    })
  },

  // 新建一条事项
  newTodo: function (e) {
    const content = e.detail.value;
    if (content.trim() != '') {
      const data = {
        content: content,
        status: 0
      };
      this.editTodo(data)
      // 清除input
      this.setData({
        newTodo: ''
      })
    }
  },

  //标记为已完成或未完成
  toggle: function (e) {
    const todoItem = e.target.dataset.todoitem;
    const id = todoItem.id;
    const status = +!todoItem.status;
    const data = {
      id: id,
      status: status
    };
    this.editTodo(data)
  },

  // 标记全部完成或未完成
  toggleAll: function () {
    const active = this.filters.active(this.data.todos).length == 0 ? false : true;
    this.data.todos.forEach(todo => {
      if (active) {
        todo.status = 1;
      } else {
        todo.status = 0;
      };
      let data = {
        id: todo.id,
        status: todo.status
      };
      this.editTodo(data)
    });
  },

  // 删除一条数据
  destroy: function (e) {
    const id = e.target.dataset.todoid;
    this.del(id)
  },

  // 删除已完成数据   批量删除
  destroyCompleted: function () {
    let ids = [];
    const allCompleted = this.filters.completed(this.data.todos);
    allCompleted.forEach(function (todo) {
      ids.push(todo.id)
    });
    this.del(ids.join(','))
  },


  // 模拟双击    双击编辑
  touchStart: function (e) {
    this.touchStartTime = e.timeStamp
  },
  touchEnd: function (e) {
    this.touchEndTime = e.timeStamp
  },
  edit: function (e) {
    const id = e.target.dataset.todoid;
    const currentTime = e.timeStamp;
    const lastTapTime = this.lastTapTime;
    const filterTodos = this.data.filterTodos;
    this.lastTapTime = currentTime;
    if (currentTime - lastTapTime < 300) {
      filterTodos.forEach(function (todo) {
        if (id == todo.id) {
          todo.edit = true;
        }
      });
      this.setData({
        filterTodos: filterTodos
      })
    }
  },

  //编辑完成  如果为空则删除  不为空提交修改
  doneEdit: function (e) {
    let filterTodos = this.data.filterTodos;
    const id = e.target.dataset.todoid;
    const editCache = e.detail.value.trim();
    filterTodos.forEach(function (todo) {
      if (id == todo.id) {
        todo.edit = false;
      }
    });
    this.setData({
      filterTodos: filterTodos
    });
    const data = {
      id: id,
      content: editCache
    };
    if (editCache == '') {
      this.del(id)
    } else {
      this.editTodo(data)
    }
  },

  // 所有
  all: function (e) {
    const all = this.filters.all(this.data.todos);
    this.setData({
      filterTodos: all,
      filtered: 'all'
    })
  },

  //进行中 
  active: function () {
    const active = this.filters.active(this.data.todos);
    this.setData({
      filterTodos: active,
      filtered: 'active'
    })
  },

  // 已完成
  completed: function () {
    const completed = this.filters.completed(this.data.todos);
    this.setData({
      filterTodos: completed,
      filtered: 'completed'
    })
  },

  // 数据过滤
  filters: {
    all: function (todos) {
      return todos;
    },
    active: function (todos) {
      return todos.filter(function (todo) {
        return !todo.status;
      });
    },
    completed: function (todos) {
      return todos.filter(function (todo) {
        return todo.status;
      });
    }
  },

  // 退出登录
  signOut: function () {
    wx.clearStorageSync('Authorization');
    wx.reLaunch({
      url: '../login/login',
    })
  },
})