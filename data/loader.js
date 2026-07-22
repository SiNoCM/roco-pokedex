// React state hook injection
// This script patches into the React app to make ge reactive
(function() {
  'use strict';
  
  var _loadedChunks = {};
  var _chunkIndex = null;
  var _loadingFile = null;
  
  // The ge variable is inside an ES module, but we can access it
  // through the module's scope if we run after it.
  // Strategy: We use Object.defineProperty on Array.prototype.push 
  // to detect when items are added to ge, and we hook into the 
  // React rendering cycle via __REACT_DEVTOOLS_GLOBAL_HOOK__
  
  // Better approach: Use a Proxy wrapper
  // After the main JS runs, ge is defined. We wait for it.
  function waitForGe(callback) {
    // Try to find ge in module scope via the root element's fiber
    var attempts = 0;
    var interval = setInterval(function() {
      attempts++;
      if (attempts > 50) { clearInterval(interval); return; }
      
      // Try to access ge through React internals
      var root = document.getElementById('root');
      if (!root || !root._reactRootContainer) {
        // Try __REACT_FIBER__
        if (root && root.__REACT_FIBER__) {
          try {
            var fiber = root.__REACT_FIBER__;
            // Walk the fiber tree to find the component that holds ge
            var found = findGeInFiber(fiber);
            if (found) {
              clearInterval(interval);
              callback(found);
              return;
            }
          } catch(e) {}
        }
      }
    }, 100);
  }
  
  function findGeInFiber(fiber) {
    if (!fiber) return null;
    // Check memoizedState for an array that looks like ge
    var state = fiber.memoizedState;
    while (state) {
      if (state.queue && Array.isArray(state.memoizedState)) {
        var arr = state.memoizedState;
        if (arr.length >= 0 && arr.length < 500 && 
            arr.length > 0 && arr[0] && arr[0].no && arr[0].name) {
          return arr; // This is likely ge
        }
      }
      state = state.next;
    }
    return findGeInFiber(fiber.child) || findGeInFiber(fiber.sibling);
  }