self.addEventListener('message', e => {
  group = JSON.parse(e.data.rule).group;
  importScripts(`./bcjh_${group.length}.js`);
  const progressCall = (progress) => {
      postMessage(progress);
  }
  Module.onRuntimeInitialized = function () {
    let result = Module.run(e.data.data, e.data.rule, e.data.passline, e.data.iterChef, e.data.iterRep, e.data.allowTool, e.data.recoverStr, progressCall);
    postMessage(result);
    self.close();
  }
});
