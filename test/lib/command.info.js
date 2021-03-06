'use strict';

/* jshint -W030 */

var Command = require('../../index')
  , helper  = require('../helper')
  , JID     = require('node-xmpp-core').JID
  , Disco   = require('xmpp-ftw-disco')
  , should  = require('should')
  , dataForms = require('xmpp-ftw').utils['xep-0004']

describe('Get info on a command', function() {

    var command, socket, xmpp, manager

    before(function() {
        socket = new helper.SocketEventer()
        xmpp = new helper.XmppEventer()
        manager = {
            socket: socket,
            client: xmpp,
            trackId: function(id, callback) {
                if (typeof id !== 'object')
                    throw new Error('Stanza ID spoofing protection not in place')
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
        socket.send('xmpp.command.info', {})
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
        socket.send('xmpp.command.info', {}, true)
    })

    it('Errors if \'node\' key not provided', function(done) {
        xmpp.once('stanza', function() {
            done('Unexpected outgoing stanza')
        })
        var callback = function(error) {
            error.should.exist
            error.type.should.equal('modify')
            error.condition.should.equal('client-error')
            error.description.should.equal('Missing \'node\' key')
            xmpp.removeAllListeners('stanza')
            done()

        }
        socket.send('xmpp.command.info', {}, callback)
    })

    it('Sends expected stanza', function(done) {
        var request = { to: 'xmpp.org', node: 'config' }
        xmpp.once('stanza', function(stanza) {
            stanza.is('iq').should.be.true
            stanza.attrs.to.should.equal('xmpp.org')
            stanza.attrs.type.should.equal('get')
            stanza.attrs.id.should.exist
            var query = stanza.getChild('query', Disco.prototype.NS_INFO)
            query.should.exist
            query.attrs.node.should.equal('config')
            done()
        })
        socket.send('xmpp.command.info', request, function() {})
    })

    it('Sets \'of\' to local server if not provided', function(done) {
        xmpp.once('stanza', function(stanza) {
            stanza.is('iq').should.be.true
            stanza.attrs.to
                .should.equal(manager.fullJid.getDomain())
            done()
        })
        socket.send('xmpp.command.info', { node: 'config' }, function() {})
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
        socket.send('xmpp.command.info', { node: 'config' }, callback)
    })

    it('Returns expected data', function(done) {
        xmpp.once('stanza', function() {
            manager.makeCallback(helper.getStanza('command-info'))
        })
        var callback = function(error, data) {
            should.not.exist(error)
            data.should.exist

            data[0].kind.should.equal('identity')
            data[0].type.should.equal('command-node')
            data[0].name.should.equal('Configure Service')
            data[0].category.should.equal('automation')

            data[1].kind.should.equal('feature')
            data[1].var.should.equal(command.NS)

            data[2].kind.should.equal('feature')
            data[2].var.should.equal(dataForms.NS)

            done()
        }
        socket.send('xmpp.command.info', { node: 'config' }, callback)
    })

})
