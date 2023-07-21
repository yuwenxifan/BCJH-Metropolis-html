self.addEventListener('message', e => {
  group = JSON.parse(e.data.rule).group;
  importScripts(`./bcjh_${group.length}.js`);
  const progressCall = (progress) => {
    console.log(progress)
    // 这里可以放postMessage之类的东西?
  }
  Module.onRuntimeInitialized = function () {
    // let progressPtr = Module._malloc(1)
    // Module.HEAP8[progressPtr] = 0;
    let result = Module.run(e.data.data, e.data.rule, e.data.passline, e.data.iterChef, e.data.iterRep, e.data.allowTool, progressCall);
    // Module._free(progressPtr)
    postMessage(result);
    self.close();
  }
});
