$(function() {
  var app = new Vue({
    el: '#main',
    data: {
      result: [],
      userId: null,
    },
    mounted() {
      let that = this;
      Module.onRuntimeInitialized = function () {
        that.printLog("加载完成");
      }
    },
    methods: {
      doRun() {
        let that = this;
        that.result = ['加载完成'];
        let userId = that.userId;
        that.printLog('开始执行');
        let response;
        if (!userId) {
          that.printLog('无用户id，获取本地数据')
          response = window.localStorage.getItem('data');
          if (!response) {
            that.printLog('【错误】本地无数据，请输入白菜菊花数据id后再执行');
          }
          that.printLog('个人数据获取成功，请耐心等待');
          setTimeout(() => {
            that.getResult(JSON.parse(response).data);
          }, 100);
        } else {
          that.printLog('用户id：' + userId + '，调接口获取个人数据')
          $.ajax({
            url: 'https://bcjh.xyz/api/download_data?id=' + userId,
            type: 'GET'
          }).then(rst => {
            response = JSON.stringify(rst);
            window.localStorage.setItem('data', response);
            that.printLog('个人数据获取成功，请耐心等待');
            setTimeout(() => {
              that.getResult(JSON.parse(response).data);
            }, 100);
          });
        }
      },
      getResult(data) {
        let that = this;
        that.printLog("")
        Promise.all([
          that.moduleRun(data),
          that.moduleRun(data),
          that.moduleRun(data),
          that.moduleRun(data),
          that.moduleRun(data),
          that.moduleRun(data),
          that.moduleRun(data),
          that.moduleRun(data),
        ]).then(results => {
          let scores = [];
          let max = 0;
          let result;
          results.forEach(r => {
            let rst = JSON.parse(r);
            scores.push(rst.score);
            if (rst.score > max) {
              max = rst.score;
              result = rst;
            }
          });
          that.printLog(`分数列表：${scores.join(', ')}`);
          let repIdx = 0;
          for (let chef of result.chefs) {
            that.printLog(`厨师：${chef}`);
            let reps = [];
            for(let i = 0; i < 3; i++) {
              reps.push(result.recipes[repIdx]);
              repIdx += 1;
            }
            that.printLog(`菜谱：${reps.join('; ')}`);
            if (repIdx % 9 == 0) {
              that.printLog('===================');
            }
          }
          that.printLog(`分数：${result.score}`);
        })
      },
      printLog(str) {
        console.log(str);
        this.result.push(str);
      },
      moduleRun(data) {
        return new Promise((resolve, reject) => {
          resolve(Module.run(data, 680020, 3170000, 5000, 1000, false))
        });
      }
    }
  });
})
