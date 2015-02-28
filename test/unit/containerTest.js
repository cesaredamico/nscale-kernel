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
var root = require('../../lib/container')();

describe('container test', function() {
  it('should get container definition by definition id', function(done) {
    root.load(require('./system.json'));
    var c = root.containerDefByDefId('4');
    assert(c.name === 'node-1');
    done();
  });

  it('should get container def by id', function(done) {
    root.load(require('./system.json'));
    var c = root.containerDefById('34');
    assert(c.name === 'node-1');
    done();
  });

  it('should get container by id', function(done) {
    root.load(require('./system.json'));
    var c = root.containerById('34');
    assert(c.containerDefinitionId = '4');
    done();
  });
});

