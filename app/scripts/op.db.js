'use strict';

window.OP = window.OP || {};
OP.indexedDB = {};
OP.indexedDB.db = null;
OP.dbname = "test1";
OP.db = { ops : {
  filterURLs : [],
  URLs : [],
  hash : {},
  experinces : []
}};

OP.indexedDB.open = function() {
  var version = 1;
  var request = indexedDB.open(OP.dbname, version);

  request.onsuccess = function(e) {
    OP.indexedDB.db = e.target.result;
    // Do some more stuff in a minute
  };

  request.onerror = OP.indexedDB.onerror;
};
OP.indexedDB.open = function() {
  var version = 1;
  var request = indexedDB.open(OP.dbname, version);

  // We can only create Object stores in a versionchange transaction.
  request.onupgradeneeded = function(e) {
    var db = e.target.result;

    // A versionchange transaction is started automatically.
    e.target.transaction.onerror = OP.indexedDB.onerror;

    if(db.objectStoreNames.contains(OP.dbname)) {
      db.deleteObjectStore(OP.dbname);
    }

    var store = db.createObjectStore(
      OP.dbname,
      {keyPath: "uid"}
    );
  };

  request.onsuccess = function(e) {
    OP.indexedDB.db = e.target.result;
    OP.indexedDB.getAllItems();
    OP.init();
  };

  request.onerror = OP.indexedDB.onerror;
};

OP.indexedDB.delete = function(uid) {
  var db = OP.indexedDB.db;
  var trans = db.transaction([OP.dbname], "readwrite");
  var store = trans.objectStore(OP.dbname);

  var request = store.delete(uid);

  trans.oncomplete = function(e) {
      console.log('deleted')
      OP.getAllItems();// reload
    //OP.indexedDB.getAllTodoItems();  // Refresh the screen
  };

  request.onerror = function(e) {
    console.log(e);
  };
};
OP.getAllItems = function(callback){
  OP.db.ops.filterURLs = [];
  OP.db.ops.URLs = [];
  OP.db.ops.hash = {};
  OP.db.ops.experinces = [];
  OP.indexedDB.getAllItems(callback);
}
OP.makeUrl = function(url){
  url = url + "/*";
  url = url.replace('\/\/*','\/*');
  return url;
}
OP.indexedDB.getAllItems = function(callback) {

  var db = OP.indexedDB.db;
  var trans = db.transaction([OP.dbname], "readwrite");
  var store = trans.objectStore(OP.dbname);

  // Get everything in the store;
  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange); // TODO; remove cursor

  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!result){
      if (callback){
        callback(OP.db.ops.experinces);
      }
      OP.setListener();
      return;
    }
    var ops = result.value;
    //ops.data = JSON.parse(ops.data);
    ops.data.uid = ops.uid;
    OP.db.ops = OP.db.ops || {};
    if (ops.data.url){
      OP.db.ops.URLs.push( ops.data.url );
      OP.db.ops.filterURLs.push( OP.makeUrl( ops.data.url ) );
      OP.db.ops.hash[ ops.data.url ] = {
        active : ops.data.active,
        id : ops.data.id,
        variant : ops.data.variant,
        title : ops.data.title
      };
    }
    OP.db.ops.experinces.push(ops.data);
    if (window.viewModel) {
      viewModel.addExperience(ops.data);      
    }
    result.continue();
  };

  cursorRequest.onerror = OP.indexedDB.onerror;
};

OP.indexedDB.add = function(obj) {
  var db = OP.indexedDB.db;
  var trans = db.transaction([OP.dbname], "readwrite");
  var store = trans.objectStore(OP.dbname);
  var request = store.put({
    "data": obj.data,
    "uid" : obj.uid || performance.now()
  });

  trans.oncomplete = function(e) {
    // Re-render all the todo's
    // OP.indexedDB.getAllTodoItems();
    console.log("complete add", e);
    OP.getAllItems();
  };

  request.onerror = function(e) {
    console.log("error", e);
  };
};

OP.indexedDB.open();
