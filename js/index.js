$(function() {
  var app = new Vue({
    el: '#main',
    data: {
      uri: 'https://bcjh.xyz/api',
      log: [],
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
      scores: [],
      resultsSimple: [],
      results: [],
      resultsDeatil: [],
      resultType: 'default',
      rstShowId: -1,
      threadCnt: 0,
      cpuCnt: 0,
      allowTool: true,
      progress: [],
      progressShow: 0,
      recoverStr: '',
      recoverStrs: [],
    },
    mounted() {
      let that = this;
      that.getTips();
      that.getRule();
      that.cpuCnt = window.navigator.hardwareConcurrency || 8;
      that.getUserCfg();
    },
    methods: {
      getUserCfg() {
        let userCfg = window.localStorage.getItem('userCfg');
        if (userCfg) {
          this.userCfg = JSON.parse(userCfg);
          this.passline = this.userCfg.passline || this.passline;
          this.resultType = this.userCfg.resultType || this.resultType;
          this.iterChef = this.userCfg.iterChef || this.iterChef;
          this.iterRep = this.userCfg.iterRep || this.iterRep;
          this.threadCnt = this.userCfg.threadCnt || this.cpuCnt;
          this.allowTool = this.userCfg.allowTool == undefined ? this.allowTool : this.userCfg.allowTool;
        } else {
          this.threadCnt = this.cpuCnt;
        }
      },
      getUrlKey(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.href) || [, ''])[1].replace(/\+/g, '%20')) || null
      },
      getTips() {
        let that = this;
        let time = this.getUrlKey('time') ? new Date(this.getUrlKey('time')) : null;
        const data = {};
        time ? data.time = JSON.parse(JSON.stringify(time)): null;
        $.ajax({
          url: `${that.uri}/get_banquet_tips`,
          type: 'GET'
        }).then(rst => {
          if (rst[0]) {
            this.$notify({
              title: '公告',
              message: rst[0].tips,
              dangerouslyUseHTMLString: true,
              duration: 0
            });
          }
        }).fail(err => {
          console.log('获取Tips失败');
        });
      },
      getRule() {
        let that = this;
        let time = this.getUrlKey('time') ? new Date(this.getUrlKey('time')) : null;
        const data = {};
        time ? data.time = JSON.parse(JSON.stringify(time)): null;
        $.ajax({
          url: `${that.uri}/get_banquet_rule`,
          type: 'GET',
          data
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
            that.ruleId = rst.rules[0].id;
          }
        }).fail(err => {
          this.$message.error('获取宴会规则失败');
        });
      },
      doRun() {
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
        that.log = [];
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
            that.getResult(JSON.parse(response).data, JSON.parse(response).user);
          }
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
              that.getResult(JSON.parse(response).data, JSON.parse(response).user);
            }
          }).fail(err => {
            that.$message({
              message: '获取个人数据失败',
              type: 'error'
            })
          });
        }
      },
      getResult(data, user) {
        let that = this;
        that.scores = [];
        that.resultsSimple = [];
        that.results = [];
        that.resultsDeatil = [];
        that.progress = [];
        if (!that.checkData(data, user)) {
          return;
        }
        that.disable = true;
        that.printLog("");
        let cnt = parseInt(that.threadCnt);
        this.printLog(`同时跑${cnt}个线程`)
        that.rstShowId = -1;
        let max = 0;
        for (let i = 0; i < cnt; i++) {
          const myWorker = new Worker('./js/worker.js?v=2'); // 创建worker
          that.progress.push(0);
          myWorker.addEventListener('message', e => { // 接收消息
            if (typeof e.data == 'number') {
              that.progress[i] = e.data;
              // 通过progressShow更新页面，页面才会实时刷新进度条数据
              that.progressShow = new Date().getTime();
            } else {
              let rst = JSON.parse(e.data);
              that.scores.push(rst.score);
              that.resultsSimple.push(that.fetchRstShow(rst));
              that.results.push(that.fetchRstByLog(rst));
              that.resultsDeatil.push(rst.logs.split('\n'));
              that.recoverStrs.push(rst.recover_str);
              if (rst.score > max) {
                max = rst.score;
                that.recoverStr = rst.recover_str;
                that.rstShowId = that.scores.length - 1;
              }
              if (that.scores.length == cnt) {
                that.disable = false;
              }
            }
          });

          myWorker.postMessage({
            data,
            rule: JSON.stringify(that.rule),
            passline: parseInt(that.passline),
            iterChef: parseInt(that.iterChef),
            iterRep: parseInt(that.iterRep),
            allowTool: that.allowTool,
            recoverStr: that.recoverStr,
          });

        }
      },
      fetchRstByLog(rst) {
        let rstShow = [];
        let logs = rst.logs.split('\n');
        let idx = 0;
        let gusetIdx = 0;
        let scores = [];
        let gusetMap = {};
        for (let log of logs) {
          if (log.slice(0, 3) == '╰─>') {
            scores.push(log.split('总价: ')[1].replace('💰︎', ''));
          }
          if (log.slice(0, 5) == '  厨师：') {
            if (idx % 3 == 0) {
              let guset = this.rule.group[gusetIdx].Title;
              gusetIdx++;
              rstShow.push(`第${gusetIdx}位客人：${guset}`);
              gusetMap[gusetIdx] = rstShow.length - 1;
            }
            rstShow.push(log);
          }
          if (log.slice(0, 5) == '  菜谱：') {
            let reps = log.split('；');
            rstShow.push(reps.map((r, i) => `${r}(${scores[i]})`).join('；'));
            scores = [];
            idx++;
            if (idx % 3 == 0) {
              rstShow.push('===================');
            }
          }
          if (['总分', '用时'].indexOf(log.slice(0, 2)) > -1) {
            rstShow.push(log);
          }
          if (`第${gusetIdx}位客人` == log.slice(0, 5)) {
            let guestStr = rstShow[gusetMap[gusetIdx]];
            rstShow[gusetMap[gusetIdx]] = guestStr + ' ' + log.split('：')[1];
          }
        }
        return rstShow;
      },
      fetchRstShow(rst) {
        let rstShow = [];
        let repIdx = 0;
        let gusetIdx = 0;
        for (let chef of rst.chefs) {
          if (repIdx % 9 == 0) {
            let guset = this.rule.group[gusetIdx].Title;
            gusetIdx++;
            rstShow.push(`第${gusetIdx}位客人：${guset}`);
          }
          rstShow.push(`厨师：${chef}`);
          let reps = [];
          for(let i = 0; i < 3; i++) {
            reps.push(rst.recipes[repIdx]);
            repIdx += 1;
          }
          rstShow.push(`菜谱：${reps.join('; ')}`);
          if (repIdx % 9 == 0) {
            rstShow.push('===================');
          }
        }
        rstShow.push(`分数：${rst.score}`);
        return rstShow;
      },
      checkData(data, user) {
        let userData;
        try {
          userData = JSON.parse(data);
        } catch (err) {
          this.printLog('个人数据内容无法解析，请联系小鱼（QQ:3526642175）报告有问题的数据ID');
        }
        let chefs = [];
        let reps  = [];
        for (let c in userData.chefGot) {
          if (userData.chefGot[c]) {
            chefs.push(c);
          }
        }
        for (let r in userData.repGot) {
          if (userData.repGot[r]) {
            reps.push(r);
          }
        }
        if (chefs.length > 0 && reps.length > 0) {
          this.printLog(`个人数据获取成功（昵称：${user}，厨师数：${chefs.length}，菜谱数：${reps.length}），请耐心等待结果输出`);
          return true;
        }
        this.printLog(`个人数据不正确（昵称：${user}，厨师数：${chefs.length}，菜谱数：${reps.length}），无法计算`);
        return false;
      },
      printLog(str) {
        console.log(str);
        this.log.push(str);
      },
    },
    watch: {
      passline(n) {
        this.userCfg.passline = n;
        window.localStorage.setItem('userCfg', JSON.stringify(this.userCfg));
      },
      resultType(n) {
        this.userCfg.resultType = n;
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
      threadCnt(n) {
        let cnt = parseInt(n);
        if (cnt < 1) {
          this.threadCnt = 1;
        } else if (cnt > 8) {
          this.threadCnt = 8;
        }
        this.userCfg.threadCnt = cnt;
        window.localStorage.setItem('userCfg', JSON.stringify(this.userCfg));
      },
      allowTool(n) {
        this.userCfg.allowTool = n;
        window.localStorage.setItem('userCfg', JSON.stringify(this.userCfg));
      },
      ruleId(id) {
        let that = this;
        that.log = [];
        that.scores = [];
        that.resultsSimple = [];
        that.results = [];
        that.progress = [];
        that.resultsDeatil = [];
        let rule = that.rules.find(r => r.id == id);
        rule.intents = that.intents;
        rule.buffs = that.buffs;
        that.rule = rule;
      }
    }
  });
})
