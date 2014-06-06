/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

var _ = require('underscore');
var uuid = require('uuid');



module.exports = function(options) {
  var _sysRoot;
  var _db;
  var _cl;
  var _builder;
  var _deployer;
  var _synchrotron;
  var _timeline;



  /**
   * list all of the available systems
   */
  var listSystems = function(cb) {
    _db.listSystems(function(err, systems) {
      cb(err, systems);
      console.log(JSON.stringify(systems, null, 2));
    });
  };



  /**
   * get the full head system definition (latest revision)
   */
  var getHeadSystem = function(systemId, cb) {
    _cl.getHead(systemId, function(err, doc) {
      cb(err, doc.system);
    });
  };



  /**
   * get the full deployed system definition
   */
  var getDeployedSystem = function(systemId, cb) {
    _cl.getDeployedRevision(systemId, function(err, doc) {
      if (doc) {
        cb(err, doc.system);
      }
      else {
        cb(err, null);
      }
    });
  };



  /**
   * create a new system
   */
  var createSystem = function(name, namespace, cb) {
    _db.createSystem(name, namespace, function(err, json) {
      if (err) { return cb(err); }
      _cl.commitRevision(json.id, 'system created', json, function(err2) {
        cb(err2, json);
      });
    });
  };



  /**
   * put the system definition
   */
  var putSystem = function(user, system, cb) {
    var doc = JSON.parse(system);
    _db.saveSystem(doc, function(err, json) {
      if (err) { return cb(err); }
      _cl.commitRevision(doc.id, 'no comment', doc, function(err) {

        if (err) {return cb(err, json);}
        var tl = {
          user: user,
          systemId: doc.id,
          type: 'putSystem',
          data: {text:'System ' + doc.name + ' updated'}
        };
        _timeline.add(JSON.stringify(tl), function(err) {
          cb(err, json);
        });

      });
    });
  };



  /**
   * delete the system
   */
  var deleteSystem = function(user, systemId, cb) {
    _db.deleteSystem(systemId, function(err, json) {
      cb(err, json);
    });
  };



  /**
   * list all of the available containers in a system
   */
  var listContainers = function(systemId, cb) {
    _db.loadSystem(systemId, function(err, json) {
      cb(err, json.containerDefinitions);
    });
  };



  /**
   * add a new container to the system
   */
  var addContainer = function(user, systemId, container, cb) {
    var cont = JSON.parse(container);
    _db.addContainer(systemId, cont, function(err, sys) {
      if (err) { return cb(err); }
      _cl.commitRevision(systemId, 'added container', sys, function(err) {

        if (err) {return cb(err);}
        var tl = {
          user: user,
          systemId: systemId,
          type: 'addContainer',
          data: {text:'Container ' + cont.name + ' added'}
        };
        _timeline.add(JSON.stringify(tl), function(err) {
          cb(err);
        });

      });
    });
  };



  /**
   * update the container
   */
  var putContainer = function(user, systemId, container, cb) {
    var cont = JSON.parse(container);
    _db.putContainer(systemId, cont, function(err, sys) {
      if (err) { return cb(err); }
      _cl.commitRevision(systemId, 'updated container', sys, function(err) {

        if (err) {return cb(err);}
        var tl = {
          user: user,
          systemId: systemId,
          type: 'putContainer',
          data: {text:'Container ' + cont.name + ' updated'}
        };
        _timeline.add(JSON.stringify(tl), function(err) {
          cb(err);
        });

      });
    });
  };



  /**
   * update the container
   */
  var deleteContainer = function(user, systemId, containerId, cb) {
    _db.deleteContainer(systemId, containerId, function(err, sys) {
      if (err) { return cb(err); }
      _cl.commitRevision(systemId, 'deleted container', sys, function(err) {

        if (err) {return cb(err);}
        var tl = {
          user: user,
          systemId: systemId,
          type: 'deleteContainer',
          data: {text:'Container ' + containerId + ' deleted'}
        };
        _timeline.add(JSON.stringify(tl), function(err) {
          cb(err);
        });

      });
    });
  };


  /**
   * build a container
   */
  var buildContainer = function(user, systemId, containerDefId, out, cb) {
    _db.loadSystem(systemId, function(err, json) {
      var root = _sysRoot(options);
      var sync = _synchrotron(options);
      root.load(json);
      var containerDef = root.containerDefByDefId(containerDefId);
//      sync.synch(json, containerDef, out, function(err) {
//        if (err) { return cb(err); }

        _builder.build(json, containerDef, out, function(err, specific) {

          console.log('SPECIFIC----------------------------------------');
          console.log(err);
          console.log(JSON.stringify(specific, null, 2));
          console.log('SPECIFIC----------------------------------------');

          // update all instantiations of the container with the new speicific block
          var matches = _.filter(json.topology.containers, function(container) {
            return container.containerDefinitionId === containerDefId;
          });
          _.each(matches, function(ctnr) { ctnr.specific = specific; });

          // increment the buildHead number on the conainer definintion
          if (containerDef.specific.buildHead) {
            containerDef.specific.buildHead = containerDef.specific.buildHead + 1;
          }

          console.log('COMMITING REVISION--------------------------------------');
          console.log(JSON.stringify(json, null, 2));
          console.log('COMMITING REVISION--------------------------------------');
          console.log(JSON.stringify(specific, null, 2));
          console.log('COMMITING REVISION--------------------------------------');
          _cl.commitRevision(systemId, 'built container: ' + specific.dockerImageId, json, function(err) {
            if (err) {return cb(err);}
            _db.saveSystem(json, function(err2) {
              if (err2) {return cb(err2);}
              var tl = {
                user: user,
                systemId: systemId,
                type: 'buildContainer',
                data: {text:'Container ' + containerDef.name + ' built'}
              };
              _timeline.add(JSON.stringify(tl), function(err) {
                cb(err);
              });
            });
          });
        });
//      });
    });
  };



  /**
   * deploy the current
   */
  var deploySystem = function(user, systemId, revisionId, out, cb) {
    if (!revisionId) {
      _cl.getHead(systemId, function(err, head) {
        out.stdout('deploying...', 'info');
        _deployer.deploy(systemId, head.revision, _db, _cl, out, cb);
      });
    }
    else {
      out.stdout('deploying...', 'info');
      _cl.convertId(systemId, revisionId, function(err, id) {
        _deployer.deploy(systemId, id, _db, _cl, out, cb);
      });
    }

    var tl = {
      user: user,
      systemId: systemId,
      type: 'deploySystem',
      data: {text:'System sudc deployed'}
    };
    _timeline.add(JSON.stringify(tl), function(err) {
    });

    /*
    _db.loadSystem(systemId, function(err, json) {
      var root = _sysRoot(options);
      root.load(json);
      out.stdout('deploying...');
      _deployer.deploy(systemId, revisionId, _db, _cl, out, cb);
    });
    */
  };



  var deployAll = function(systemId, revisionId, out, cb) {
    _db.loadSystem(systemId, function(err, json) {
      var root = _sysRoot(options);
      root.load(json);
      out.stdout('deploying all...');

      _cl.convertId(systemId, revisionId, function(err, id) {
        _deployer.deployAll(systemId, id, _db, _cl, out, cb);
      });
    });
  };



  /**
   * get the revision history for a system
   */
  var listRevisions = function(systemId, cb) {
    _cl.listRevisions(systemId, function(err, revisions) {
      cb(err, revisions);
    });
  };



  /**
   * get a specific revision
   */
  var getRevision = function(systemId, revisionId, cb) {
    _cl.convertId(systemId, revisionId, function(err, id) {
      _cl.getRevision(systemId, id, function(err, revision) {
        cb(err, revision);
      });
    });
  };



  /**
   * get timeline
   */
  var timeline = function(systemId, containerId, cb) {
    _timeline.timeline(systemId, containerId, null, function(err, result) {
      cb(err, result);
    });
  };



  /**
   * add to timeline
   */
  var addToTimeline = function(timelineJson, cb) {
    _timeline.add(timelineJson, function(err) {
      cb(err);
    });
  };



  var construct = function() {
    _sysRoot = require('./container/root');
    _synchrotron = require('./container/synch/syncrotron');
    _db = require('./db/db')(options);
    _cl = require('../lib/commitlog/commitlog')(options);
    _builder = require('./container/build/builder')(options);
    _deployer = require('./topology/deploy/deployer')(options);
    _timeline = require('../lib/timeline/timeline')(options);
  };



  construct();
  return {
    listSystems: listSystems,
    createSystem: createSystem,
    getHeadSystem: getHeadSystem,
    getDeployedSystem: getDeployedSystem,
    putSystem: putSystem,
    deleteSystem: deleteSystem,

    listContainers: listContainers,
    buildContainer: buildContainer,
    addContainer: addContainer,
    putContainer: putContainer,
    deleteContainer: deleteContainer,
//    deployContainer: deployContainer
    deploySystem: deploySystem,
    deployAll: deployAll,

    listRevisions: listRevisions,
    getRevision: getRevision,

    timeline: timeline,
    addToTimeline: addToTimeline
  };
};

