

var backgroundPage = chrome.extension.getBackgroundPage(),
    getOPS = function(){
      backgroundPage.OP.getAllItems(function(experinces){
          install(experinces);
      });
      //return backgroundPage.OP.db.ops;
    },
    install = function(experinces){
      var i = 0;
      viewModel.experiences.removeAll();
      for (; i < experinces.length ; i++){
        viewModel.addExperience( experinces[i] ); 
      }
      // alert( experinces.length )
      //if (experinces.length === 0){
        // viewModel.add();
      //}
    },
    init = function(){
      getOPS();
    }

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
        if (confirm("Remove Item")){
            backgroundPage.OP.indexedDB.delete(experience.uid);
        }
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
            // overwrite existing record
            console.log("saving", data.uid, store)
            backgroundPage.OP.indexedDB.add( {
                uid: data.uid,
                data : store
            } );
        }
    };
};

var viewModel = new ExperienceModel();

ko.applyBindings(viewModel);


viewModel.experiences.extend({ rateLimit: 100 });// throttle updates
viewModel.experiences.subscribe(function(){
    viewModel.save();
});

init();

// Activate jQuery Validation
// $("form").validate({ submitHandler: viewModel.save });
