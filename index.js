var result = '';
Module.onRuntimeInitialized = function () {
  printLog("加载完成")
  document.getElementById('start').onclick = doRun;

  function doRun() {
    result = '加载完成<br>';
    printLog('开始执行')
    var userId = document.getElementById('userId').value;
    let response;
    if (!userId) {
      printLog('无用户id，获取本地数据')
      response = window.localStorage.getItem('data');
      if (!response) {
        printLog('【错误】本地无数据，请输入白菜菊花数据id后再执行');
      }
      printLog('个人数据获取成功，请耐心等待');
      setTimeout(() => {
        getResult(JSON.parse(response).data);
      }, 100);
    } else {
      printLog('用户id：' + userId + '，调接口获取个人数据')
      $.ajax({
        url: 'https://bcjh.xyz/api/download_data?id=' + userId,
        type: 'GET'
      }).then(rst => {
        response = JSON.stringify(rst);
        window.localStorage.setItem('data', response);
        printLog('个人数据获取成功，请耐心等待');
        setTimeout(() => {
          getResult(JSON.parse(response).data);
        }, 100);
      });
    }
  }
}

function getResult(data) {
  printLog("")
  Promise.all([
    moduleRun(data),
    moduleRun(data),
    moduleRun(data),
    moduleRun(data),
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
    printLog(`分数列表：${scores.join(', ')}`);
    let repIdx = 0;
    for (let chef of result.chefs) {
      printLog(`厨师：${chef}`);
      let reps = [];
      for(let i = 0; i < 3; i++) {
        reps.push(result.recipes[repIdx]);
        repIdx += 1;
      }
      printLog(`菜谱：${reps.join('; ')}`);
      if (repIdx % 9 == 0) {
        printLog('===================');
      }
    }
    printLog(`分数：${result.score}`);
  })
  // setTimeout(() => {
  //   var results = await Promise.all([
  //     moduleRun(data),
  //     moduleRun(data),
  //     moduleRun(data),
  //     moduleRun(data),
  //     moduleRun(data),
  //     moduleRun(data),
  //   ])
  //   console.log(result);
  //   result = JSON.parse(results[0]);
  //   let repIdx = 0;
  //   for (let chef of result.chefs) {
  //     printLog(`厨师：${chef}`);
  //     let reps = [];
  //     for(let i = 0; i < 3; i++) {
  //       reps.push(result.recipes[repIdx]);
  //       repIdx += 1;
  //     }
  //     printLog(`菜谱：${reps.join('; ')}`);
  //     if (repIdx % 9 == 0) {
  //       printLog('===================');
  //     }
  //   }
  //   printLog(`分数：${result.score}`);
  // });
}

function printLog(str) {
  console.log(str);
  result += str + '<br>';
  $("#result").html(result);
}

function moduleRun(data) {
  return new Promise((resolve,reject) => {
    resolve(Module.run(data))
  });
}