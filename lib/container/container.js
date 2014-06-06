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

var assert = require('assert');



/**
 * container abstraction
 */
exports.create = function(system, json, options) {
  assert(system);
  assert(json);
  assert(options);
  assert(json.type);
  assert(json.id);



  var stringify = function() {
    return JSON.stringify(json, null, 2);
  };



  /**
   * construct the container
   */
  var construct = function() {
    // extend json here...
  };



  construct();
  return json;
 /* 
  {
    id: json.id,
    stringify: stringify,
    buildScript: json.specific.buildScript,
    targetName: json.specific.targetName,
    namespace: system.namespace,
    path: json.specific.path,
    type: json.type
  };
  */
};

