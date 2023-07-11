$(function() {
  var app = new Vue({
    el: '#main',
    data: {
      uri: 'https://bcjh.xyz/api',
      result: [],
      form: {},
      userId: null,
      rules: [],
      disable: false,
      ruleId: null,
      passline: null,
      iterChef: 5000,
      iterRep: 1000,
      userCfg: {},
      rule: {},
      initialized: false,
      guestCnt: 0
    },
    mounted() {
      let that = this;
      that.getRule();
    },
    methods: {
      getUserCfg() {
        let userCfg = window.localStorage.getItem('userCfg');
        if (userCfg) {
          this.userCfg = JSON.parse(userCfg);
          this.ruleId = this.userCfg.ruleId;
          this.passline = this.userCfg.passline || this.passline;
          this.iterChef = this.userCfg.iterChef || this.iterChef;
          this.iterRep = this.userCfg.iterRep || this.iterRep;
        }
      },
      getRule() {
        let that = this;
        $.ajax({
          url: `${that.uri}/get_banquet_rule`,
          type: 'GET'
        }).then(rst => {
          if (!rst) {
            that.$message({
              message: '没有获取到宴会规则！',
              type: 'error'
            });
          } else {
            that.rules = rst.rules;
            that.intents = rst.intents;
            that.buffs = rst.buffs;
            that.getUserCfg();
            if (!that.rule) {
              that.ruleId = rst.rules[0].id;
            }
            setTimeout(() => {
              loadJS(`./js/bcjh_${that.rule.group.length}.js`, function () {
                Module.onRuntimeInitialized = function () {
                  that.initialized = true;
                  that.printLog('加载完成');
                  that.guestCnt = that.rule.group.length;
                }
              });
            });
          }
        });
      },
      doRun() {
        if (!this.initialized) {
          this.$message({
            message: '请等待页面出现加载完成字样后再点击开始',
            type: 'error'
          });
          return;
        }
        if (!this.passline || !this.iterChef || !this.iterRep) {
          this.$message({
            message: '请填写必填项',
            type: 'error'
          });
        } else {
          this.exec();
        }
      },
      exec() {
        let that = this;
        that.result = ['加载完成'];
        let userId = that.userId;
        that.printLog('开始执行');
        let response;
        if (!userId) {
          that.printLog('无用户id，获取本地数据')
          response = window.localStorage.getItem('data');
          if (!response) {
            that.$message({
              message: '【错误】本地无数据，请输入白菜菊花数据id后再执行',
              type: 'error'
            })
          } else {
            that.printLog('个人数据获取成功，请耐心等待');
          }
          that.disable = true;
          setTimeout(() => {
            that.getResult(JSON.parse(response).data);
          }, 100);
        } else {
          that.printLog('用户id：' + userId + '，调接口获取个人数据')
          $.ajax({
            url: `${that.uri}/download_data?id=${userId}`,
            type: 'GET'
          }).then(rst => {
            if (!rst.result) {
              that.$message({
                message: rst.msg,
                type: 'error'
              })
            } else {
              response = JSON.stringify(rst);
              window.localStorage.setItem('data', response);
              that.printLog('个人数据获取成功，请耐心等待');
            }
            that.disable = true;
            setTimeout(() => {
              that.getResult(JSON.parse(response).data);
            }, 100);
          }).fail(err => {
            that.$message({
              message: '获取个人数据失败',
              type: 'error'
            })
          });
        }
      },
      getResult(data) {
        let that = this;
        that.printLog("")
        const cnt = 8;
        let scores = [];
        let max = 0;
        let result;
        for (let i = 0; i < cnt; i++) {
          let rst = JSON.parse(that.moduleRun(data));
          scores.push(rst.score);
          if (rst.score > max) {
            max = rst.score;
            result = rst;
            if (max > that.passline) {
              break;
            }
          }
        }
        that.printLog(`分数列表：${scores.join(', ')}`);
        that.printLog('最佳结果：');
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
        that.disable = false;
      },
      printLog(str) {
        console.log(str);
        this.result.push(str);
      },
      moduleRun(data) {
        let that = this;
        console.log(JSON.stringify(that.rule))
        return Module.run(data, JSON.stringify(that.rule), parseInt(that.passline), parseInt(that.iterChef), parseInt(that.iterRep), false);
      }
    },
    watch: {
      passline(n) {
        this.userCfg.passline = n;
        window.localStorage.setItem('userCfg', JSON.stringify(this.userCfg));
      },
      iterChef(n) {
        this.userCfg.iterChef = n;
        window.localStorage.setItem('userCfg', JSON.stringify(this.userCfg));
      },
      iterRep(n) {
        this.userCfg.iterRep = n;
        window.localStorage.setItem('userCfg', JSON.stringify(this.userCfg));
      },
      ruleId(id) {
        this.userCfg.ruleId = id;
        window.localStorage.setItem('userCfg', JSON.stringify(this.userCfg));
        let that = this;
        that.result = [];
        let rule = that.rules.find(r => r.id == id);
        // 贵客数量
        let guestCnt = rule.group.length;
        rule.intents = that.intents;
        rule.buffs = that.buffs;
        that.rule = rule;
        // 如果贵客数量变了，刷新页面
        if (that.guestCnt != 0 && that.guestCnt != guestCnt) {
          location.reload();
        } else if (that.guestCnt == guestCnt) {
          that.printLog('加载完成');
        }
      }
    }
  });
})

function loadJS(url, callback) {
  var script = document.createElement("script");
  script.type = "text/javascript";
  if (script.readyState) { // IE
    script.onreadystatechange = function () {
      if (script.readyState == "loaded" || script.readyState == "complete") {
        script.onreadystatechange = null;
        callback();
      }
    };
  } else { //Other browsers
    script.onload = function () {
      callback();
    };
  }
  script.src = url;
  document.getElementsByTagName("head")[0].appendChild(script);
}

function removeJS(url){
  var scripts = document.getElementsByTagName('script');
  for(var i=0; i<scripts.length; i++){
    if(scripts[i].src.includes(url)){
      document.getElementsByTagName('head')[0].removeChild(scripts[i]);
      break;
    }
  }
}