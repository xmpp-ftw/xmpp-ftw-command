'use strict';

/* jshint -W030 */

var Command = require('../../index')
  , helper  = require('../helper')
  , JID     = require('node-xmpp-core').JID
  , should  = require('should')

describe('Execute commands', function() {

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

    it('Errors when no callback provided', function(done) {
        xmpp.once('stanza', function() {
            done('Unexpected outgoing stanza')
        })
        socket.once('xmpp.error.client', function(error) {
            error.type.should.equal('modify')
            error.condition.should.equal('client-error')
            error.description.should.equal('Missing callback')
            xmpp.removeAllListeners('stanza')
            done()
        })
        socket.send('xmpp.command.execute', {})
    })

    it('Errors when non-function callback provided', function(done) {
        xmpp.once('stanza', function() {
            done('Unexpected outgoing stanza')
        })
        socket.once('xmpp.error.client', function(error) {
            error.type.should.equal('modify')
            error.condition.should.equal('client-error')
            error.description.should.equal('Missing callback')
            xmpp.removeAllListeners('stanza')
            done()
        })
        socket.send('xmpp.command.execute', {}, true)
    })

    it('Errors if missing \'node\' key', function(done) {
        xmpp.once('stanza', function() {
            done('Unexpcted outgoing stanza')
        })
        var callback = function(error, data) {
            should.not.exist(data)
            error.type.should.equal('modify')
            error.condition.should.equal('client-error')
            error.description.should.equal('Missing \'node\' key')
            xmpp.removeAllListeners('stanza')
            done()
        }
        socket.send('xmpp.command.execute', {}, callback)
    })

    it('Sends expected simple stanza', function(done) {
        var request = { to: 'xmpp.org', node: 'list' }
        xmpp.once('stanza', function(stanza) {
            stanza.is('iq').should.be.true
            stanza.attrs.to.should.equal('xmpp.org')
            stanza.attrs.type.should.equal('set')
            stanza.attrs.id.should.exist
            var cmd = stanza.getChild('command', command.NS)
            cmd.should.exist
            cmd.attrs.node.should.equal('list')
            cmd.attrs.action.should.equal('execute')
            done()
        })
        socket.send('xmpp.command.execute', request, function() {})
    })

    it('Sets \'to\' to local server if not provided', function(done) {
        var request = { node: 'list' }
        xmpp.once('stanza', function(stanza) {
            stanza.attrs.to.should.equal('example.com')
            done()
        })
        socket.send('xmpp.command.execute', request, function() {})
    })

    it('Handles error response', function(done) {
        xmpp.once('stanza', function() {
            manager.makeCallback(helper.getStanza('iq-error'))
        })
        var callback = function(error, success) {
            should.not.exist(success)
            error.should.eql({
                type: 'cancel',
                condition: 'error-condition'
            })
            done()
        }
        socket.send('xmpp.command.execute', { node: 'config' }, callback)
    })

    describe('Single stage results', function() {

        it.skip('Handles data form response', function(done) {
            done('Incomplete')
        })

        it.skip('Handles OOB response', function(done) {
            done('Incomplete')
        })

    })

})
