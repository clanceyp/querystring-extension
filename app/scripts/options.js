'use strict';

window.OP = window.OP || {};
OP.indexedDB = {};
OP.indexedDB.db = null;
OP.dbname = "test1";
OP.experiences = [];

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
  };

  request.onerror = OP.indexedDB.onerror;
};
window.experiences = [];
OP.indexedDB.delete = function(uid) {
  var db = OP.indexedDB.db;
  var trans = db.transaction([OP.dbname], "readwrite");
  var store = trans.objectStore(OP.dbname);

  var request = store.delete(uid);

  trans.oncomplete = function(e) {
      console.log('deleted')
    //OP.indexedDB.getAllTodoItems();  // Refresh the screen
  };

  request.onerror = function(e) {
    console.log(e);
  };
};
OP.indexedDB.getAllItems = function() {

  var db = OP.indexedDB.db;
  var trans = db.transaction([OP.dbname], "readwrite");
  var store = trans.objectStore(OP.dbname);

  // Get everything in the store;
  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);

  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!!result == false){
      return;
    }

    experiences.push(result.value);
    console.log( result.value )
    var ops = result.value;
    ops.data = JSON.parse(ops.data);
    ops.data.uid = ops.uid;
    console.log('hello', ops);
    if (!ops.data.url) {
        // console.log('hello delete ', i, ops.uid);
        // OP.indexedDB.delete(ops.uid);
    } else {
      // console.log('hello display', ops.data);
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
    console.log("complete ", e);
  };

  request.onerror = function(e) {
    console.log("error", e);
  };
};

OP.indexedDB.open()


var Experience = function(ops){
        var self = this,
            _parent = ops.parent;
        self.id = ko.observable(ops.id);
        self.url = ko.observable(ops.url);
        self.variant = ko.observable(ops.variant);
        self.active = ko.observable(ops.active);
        self.title = ko.observable(ops.title);
        self.uid = ops.uid || performance.now();
        self.ID = ops.id;
        self.URL = ops.url;
        self.VARIANT = ops.variant;
        self.TITLE = ops.title;
        self.ACTIVE = ops.active;
        self.VALID = ops.valid;

        self.id.subscribe(function(value) {
            self.ID = value;
            if (_parent) {
                _parent.save();
            }
        });
        self.url.subscribe(function(value) {self.URL = value; if (_parent) {_parent.save();}});
        self.variant.subscribe(function(value) {self.VARIANT = value; if (_parent) {_parent.save();}});
        self.title.subscribe(function(value) {self.TITLE = value; if (_parent) {_parent.save();}});
        self.active.subscribe(function(value) {self.ACTIVE = value; if (_parent) {_parent.save();}});

        return self;
}

var ExperienceModel = function(experiences) {
    var self = this;
    self.experiences = ko.observableArray(experiences);

    self.addExperience = function(data) {
        data = data || { url: "", id: "", variant : "1", active : "true", title: "" };
        data.parent = self;
        self.experiences.push(new Experience( data ));
    };

    self.removeExperience = function(experience) {
        self.experiences.remove(experience);
        OP.indexedDB.delete(experience.uid);
    };

    self.save = function(form) {
        //console.log("Could now transmit to server: " , ko.utils.stringifyJson(self.experiences));
        //alert(  self.experiences().length )
        var i = 1, uid, data, store = {};
        for (; i <= self.experiences().length; i++){
            data = self.experiences()[i-1];
            console.log(data)
            store.active = data.ACTIVE;
            store.url = data.URL;
            store.id = data.ID;
            store.variant = data.VARIANT;
            store.title = data.TITLE;
            store.valid = false;
            if (store.url && store.title && store.id){
              store.valid = true;
            }
            //console.log("data ", data.uid,  ko.utils.stringifyJson( data ));
            OP.indexedDB.add( {
                uid: data.uid,
                data: ko.utils.stringifyJson( store )
            } );
        }
//        OP.indexedDB.add("hello");
    };
};

var viewModel = new ExperienceModel();

ko.applyBindings(viewModel);


viewModel.experiences.extend({ rateLimit: 100 });// throttle updates
viewModel.experiences.subscribe(function(){
    viewModel.save();
});

// Activate jQuery Validation
// $("form").validate({ submitHandler: viewModel.save });
