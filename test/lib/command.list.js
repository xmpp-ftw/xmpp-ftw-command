'use strict';

/* jshint -W030 */

var Command = require('../../index')
  , helper  = require('../helper')
  , JID     = require('node-xmpp-core').JID
  , Disco   = require('xmpp-ftw-disco')
  , should  = require('should')

describe('List commands', function() {

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
        socket.send('xmpp.command.list', {})
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
        socket.send('xmpp.command.list', {}, true)
    })

    it('Sends expected stanza', function(done) {
        var request = { of: 'xmpp.org' }
        xmpp.once('stanza', function(stanza) {
            stanza.is('iq').should.be.true
            stanza.attrs.to.should.equal(request.of)
            stanza.attrs.type.should.equal('get')
            var query = stanza.getChild('query', Disco.prototype.NS_ITEMS)
            query.should.exist
            query.attrs.node.should.equal(command.NS)
            done()
        })
        socket.send('xmpp.command.list', request, function() {})
    })

    it('Sets \'of\' to local server if not provided', function(done) {
        xmpp.once('stanza', function(stanza) {
            stanza.is('iq').should.be.true
            stanza.attrs.to
                .should.equal(manager.fullJid.getDomain())
            done()
        })
        socket.send('xmpp.command.list', {}, function() {})
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
        socket.send('xmpp.command.list', {}, callback)
    })

    it('Returns expected data', function(done) {
        xmpp.once('stanza', function() {
            manager.makeCallback(helper.getStanza('command-list'))
        })
        var callback = function(error, data) {
            should.not.exist(error)
            data.length.should.equal(6)
            data[0].should.eql({
                node: 'list',
                name: 'List Service Configurations'
            })
            should.not.exist(data[1].jid)
            data[1].name.should.equal('Configure Service')
            data[1].node.should.equal('config')
            done()
        }
        socket.send('xmpp.command.list', {}, callback)
    })
})
