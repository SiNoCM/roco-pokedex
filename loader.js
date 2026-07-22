// roco-pokedex async data loader
// Loads spirit data in chunks: first 50 immediately, rest on demand
(function() {
  'use strict';

  // Patch Array.prototype.push to detect when data is pushed to ge
  // and trigger React re-renders
  var _originalPush = Array.prototype.push;
  var _geRef = null;
  var _reactSetState = null;
  
  // Find the ge array by walking React fiber tree
  function findGeArray() {
    var root = document.getElementById('root');
    if (!root) return null;
    
    // React 18 creates root via createRoot
    var fiberKey = Object.keys(root).find(function(k) {
      return k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$');
    });
    if (!fiberKey) return null;
    
    var fiber = root[fiberKey];
    return findArrayInFiber(fiber);
  }
  
  function findArrayInFiber(fiber) {
    if (!fiber) return null;
    
    // Check memoizedState for arrays
    var state = fiber.memoizedState;
    var depth = 0;
    while (state && depth < 30) {
      if (state.memoizedState && Array.isArray(state.memoizedState) && state.memoizedState.length >= 0) {
        var arr = state.memoizedState;
        // Check if this looks like the ge array (has objects with 'no' and 'name' fields)
        if (arr.length === 0 || (arr[0] && arr[0].no && arr[0].name && arr[0].image)) {
          return { array: arr, queue: state.queue, fiber: fiber };
        }
      }
      state = state.next;
      depth++;
    }
    
    return findArrayInFiber(fiber.child) || findArrayInFiber(fiber.sibling);
  }
  
  // Force React to re-render by triggering the state setter
  function forceReactUpdate(geRef) {
    if (!geRef || !geRef.queue) return;
    
    // Dispatch a new empty array reference to trigger re-render
    // React's useState dispatch with a function
    if (geRef.queue && geRef.queue.dispatch) {
      geRef.queue.dispatch(function(prev) { return prev; });
    }
  }

  // === Chunk loading logic ===
  var loadedChunks = new Set();
  var chunkIndex = null;
  var loadingFiles = new Set();
  
  function loadChunk(file) {
    if (loadedChunks.has(file) || loadingFiles.has(file)) return Promise.resolve();
    loadingFiles.add(file);
    
    return fetch(file)
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(data) {
        loadedChunks.add(file);
        loadingFiles.delete(file);
        
        // Find ge and push data
        var geRef = findGeArray();
        if (geRef && geRef.array) {
          // Push each item individually
          data.forEach(function(item) {
            geRef.array.push(item);
          });
          // Force React re-render
          forceReactUpdate(geRef);
        }
      })
      .catch(function(err) {
        loadingFiles.delete(file);
        console.error('[Loader] Failed:', file, err);
      });
  }
  
  function loadIndex() {
    return fetch('./data/index.json')
      .then(function(r) { return r.json(); })
      .then(function(idx) {
        chunkIndex = idx;
        // Load first chunk immediately
        if (idx.length > 0) return loadChunk(idx[0].file);
      });
  }
  
  // Start: load index and first chunk
  loadIndex();
  
  // Expose for debugging
  window.__loader = {
    loadAll: function() {
      if (!chunkIndex) return loadIndex().then(function() { return window.__loader.loadAll(); });
      return Promise.all(chunkIndex.map(function(c) { return loadChunk(c.file); }));
    },
    loaded: function() { return loadedChunks.size + '/' + (chunkIndex ? chunkIndex.length : '?'); }
  };
  
  console.log('[Loader] Initialized, loading first chunk...');
})();