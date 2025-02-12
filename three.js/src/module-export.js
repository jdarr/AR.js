(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root = factory();
  }
}(this, function() {
    return { 
      WebAR: THREE.WebAR,
      THREEx: THREEx,
      ARjs: ARjs,
    };
}));