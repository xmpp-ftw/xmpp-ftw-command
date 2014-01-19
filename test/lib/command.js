'use strict';

/* jshint -W030 */

var Command = require('../../index')
  , ltx    = require('ltx')
  , helper = require('../helper')

describe('Commands', function() {

    var command, socket, xmpp, manager

    var namespace = 'http://jabber.org/protocol/commands'

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
            fullJid: {
                local: 'user',
                domain: 'example.com',
                resource: 'laptop'
            },
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

    describe('Handles', function() {

        it('Returns false by default', function() {
            command.handles(ltx.parse('<message/>')).should.be.false
        })

    })

    describe('Command', function() {

        it('Has the correct namespace', function() {
            command.NS.should.equal(namespace)
        })

    })

})