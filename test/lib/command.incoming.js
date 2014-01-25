'use strict';

/* jshint -W030 */

var Command = require('../../index')
  , helper  = require('../helper')
  , JID     = require('node-xmpp-core').JID
  , ltx     = require('ltx')

describe('Incoming commands', function() {

    var command, socket, xmpp, manager

    before(function() {
        socket = new helper.SocketEventer()
        xmpp = new helper.XmppEventer()
        manager = {
            socket: socket,
            client: xmpp,
            trackId: function(id, callback) {
                this.callback = callback
            },
            makeCallback: function(error, data) {
                this.callback(error, data)
            },
            fullJid: new JID('user@example.com/laptop'),
            _getLogger: function() {
                return {
                    log: function() {},
                    error: function() {},
                    warn: function() {},
                    info: function() {}
                }
            }
        }
        command = new Command()
        command.init(manager)
    })

    beforeEach(function() {
        socket.removeAllListeners()
        xmpp.removeAllListeners()
        command.init(manager)
    })

    it('Does not handle non-message stanzas', function() {
        command.handles(ltx.parse('<iq/>')).should.be.false
    })

    it('Does not handle message stanzas without <query/> child', function() {
        command.handles(ltx.parse('<message><body>Hi</body></message>'))
            .should.be.false
    })

    it('Should not handle query without \'node\' attribute', function() {
        var stanza = ltx.parse('<message><query/></message>')
        command.handles(stanza).should.be.false
    })

    it('Should not handle stanza without correct \'node\' value', function() {
        var stanza = ltx.parse('<message><query node="blah"/></message>')
        command.handles(stanza).should.be.false
    })

    it('Handles expected incoming message stanza', function() {
        var stanza = helper.getStanza('incoming')
        command.handles(stanza).should.be.true
    })

})
