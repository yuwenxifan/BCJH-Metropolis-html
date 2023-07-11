self.addEventListener('message', e => {
  group = JSON.parse(e.data.rule).group;
  importScripts(`./bcjh_${group.length}.js`);
  Module.onRuntimeInitialized = function () {
    postMessage(Module.run(e.data.data, e.data.rule, e.data.passline, e.data.iterChef, e.data.iterRep, false))
  }
});
