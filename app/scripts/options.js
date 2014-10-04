'use strict';

var html5rocks = {};
html5rocks.indexedDB = {};
html5rocks.indexedDB.db = null;
html5rocks.dbname = "test1";
html5rocks.experiences = [];

html5rocks.indexedDB.open = function() {
  var version = 1;
  var request = indexedDB.open(html5rocks.dbname, version);

  request.onsuccess = function(e) {
    html5rocks.indexedDB.db = e.target.result;
    // Do some more stuff in a minute
  };

  request.onerror = html5rocks.indexedDB.onerror;
};
html5rocks.indexedDB.open = function() {
  var version = 1;
  var request = indexedDB.open(html5rocks.dbname, version);

  // We can only create Object stores in a versionchange transaction.
  request.onupgradeneeded = function(e) {
    var db = e.target.result;

    // A versionchange transaction is started automatically.
    e.target.transaction.onerror = html5rocks.indexedDB.onerror;

    if(db.objectStoreNames.contains(html5rocks.dbname)) {
      db.deleteObjectStore(html5rocks.dbname);
    }

    var store = db.createObjectStore(html5rocks.dbname,
      {keyPath: "uid"});
  };

  request.onsuccess = function(e) {
    html5rocks.indexedDB.db = e.target.result;
    html5rocks.indexedDB.getAllItems();
  };

  request.onerror = html5rocks.indexedDB.onerror;
};
window.experiences = [];
html5rocks.indexedDB.delete = function(uid) {
  var db = html5rocks.indexedDB.db;
  var trans = db.transaction([html5rocks.dbname], "readwrite");
  var store = trans.objectStore(html5rocks.dbname);

  var request = store.delete(uid);

  trans.oncomplete = function(e) {
      console.log('deleted')
    //html5rocks.indexedDB.getAllTodoItems();  // Refresh the screen
  };

  request.onerror = function(e) {
    console.log(e);
  };
};
html5rocks.indexedDB.getAllItems = function() {

  var db = html5rocks.indexedDB.db;
  var trans = db.transaction([html5rocks.dbname], "readwrite");
  var store = trans.objectStore(html5rocks.dbname);

  // Get everything in the store;
  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);

  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!!result == false)
      return;

    experiences.push(result.value);
    console.log( result.value )
    var ops = result.value;
    ops.data = JSON.parse(ops.data);
    ops.data.uid = ops.uid;
    console.log('hello', ops);
    if (!ops.data.url) {
        console.log('hello delete ', i, ops.uid);
        html5rocks.indexedDB.delete(ops.uid);
    } else {
      console.log('hello display', ops.data);
      viewModel.addExperience(ops.data);      
    }

    

    result.continue();

  };

  cursorRequest.onerror = html5rocks.indexedDB.onerror;
  cursorRequest.oncomplete = function(e){
    alert( 'boom' );
    // viewModel.addAll(html5rocks.experiences);
  }
};

html5rocks.indexedDB.add = function(obj) {
  var db = html5rocks.indexedDB.db;
  var trans = db.transaction([html5rocks.dbname], "readwrite");
  var store = trans.objectStore(html5rocks.dbname);
  var request = store.put({
    "data": obj.data,
    "uid" : obj.uid || performance.now()
  });

  trans.oncomplete = function(e) {
    // Re-render all the todo's
    // html5rocks.indexedDB.getAllTodoItems();
    console.log("complete ", e);
  };

  request.onerror = function(e) {
    console.log("error", e);
  };
};

html5rocks.indexedDB.open()


var Experience = function(ops){
        var self = this,
            _parent = ops.parent;
        self.id = ko.observable(ops.id);
        self.url = ko.observable(ops.url);
        self.variant = ko.observable(ops.variant);
        self.active = ko.observable(ops.active);
        self.uid = ops.uid || performance.now();
        self.ID = ops.id;
        self.URL = ops.url;
        self.VARIANT = ops.variant;
        self.ACTIVE = ops.active;

        self.id.subscribe(function(value) {
            self.ID = value;
            if (_parent) {
                _parent.save();
            }
        });
        self.url.subscribe(function(value) {self.URL = value; if (_parent) {_parent.save();}});
        self.variant.subscribe(function(value) {self.VARIANT = value; if (_parent) {_parent.save();}});
        self.active.subscribe(function(value) {self.ACTIVE = value; if (_parent) {_parent.save();}});

        return self;
}

var ExperienceModel = function(experiences) {
    var self = this;
    self.experiences = ko.observableArray(experiences);

    self.addExperience = function(data) {
        data = data || { url: "", id: "", variant : "1", active : "true" };
        data.parent = self;
        self.experiences.push(new Experience( data ));
    };

    self.addAll = function(experiences){
      for (var i = 0, data, string; i < experiences.length; i++){
          //string = experiences[i].replace('"','\"');
          data = JSON.parse(experiences[i].data);
          data.uid = experiences[i].uid;
          if (!data.url) {
              html5rocks.indexedDB.delete(uid);
              continue;
          }

          console.log('hello', i, data)
          // viewModel.addExperience(data);
      }
    };

    self.removeExperience = function(experience) {
        self.experiences.remove(experience);
        html5rocks.indexedDB.delete(experience.uid);
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
            store.variant = data.VARIANT;
            //console.log("data ", data.uid,  ko.utils.stringifyJson( data ));
            html5rocks.indexedDB.add( {
                uid: data.uid,
                data: ko.utils.stringifyJson( store )
            } );
        }
//        html5rocks.indexedDB.add("hello");
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
