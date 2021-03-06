'use strict';

/* jshint -W030 */

var Command = require('../../index')
  , helper  = require('../helper')
  , JID     = require('node-xmpp-core').JID
  , should  = require('should')
  , dataForm = require('xmpp-ftw').utils['xep-0004']

describe('Execute commands', function() {

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
        socket.send('xmpp.command.do', {})
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
        socket.send('xmpp.command.do', {}, true)
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
        socket.send('xmpp.command.do', {}, callback)
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
        socket.send('xmpp.command.do', request, function() {})
    })

    it('Sets \'to\' to local server if not provided', function(done) {
        var request = { node: 'list' }
        xmpp.once('stanza', function(stanza) {
            stanza.attrs.to.should.equal('example.com')
            done()
        })
        socket.send('xmpp.command.do', request, function() {})
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
        socket.send('xmpp.command.do', { node: 'config' }, callback)
    })

    it('Allows different actions', function(done) {
        var request = { node: 'list', action: 'prev' }
        xmpp.once('stanza', function(stanza) {
            stanza.getChild('command').attrs.action.should.equal(request.action)
            done()
        })
        socket.send('xmpp.command.do', request, function() {})
    })

    describe('Single stage results', function() {

        it('Handles data form response', function(done) {
            xmpp.once('stanza', function() {
                manager.makeCallback(
                    helper.getStanza('result-execute-data-form')
                )
            })
            var callback = function(error, data) {
                should.not.exist(error)
                data.status.should.equal('completed')
                data.form.should.exist
                should.not.exist(data.oob)
                data.form.title.should.equal('Available Services')
                data.form.reported.length.should.equal(5)
                data.form.items.length.should.equal(3)
                data.form.items[0].length.should.equal(5)
                done()
            }
            socket.send('xmpp.command.do', { node: 'config' }, callback)
        })

        it('Handles OOB response', function(done) {
            xmpp.once('stanza', function() {
                manager.makeCallback(
                    helper.getStanza('result-execute-oob')
                )
            })
            var callback = function(error, data) {
                should.not.exist(error)
                data.status.should.equal('completed')
                should.not.exist(data.form)
                data.oob.should.exist
                data.oob.url.should.equal('http://www.jabber.org/do-something')
                data.oob.description.should.equal('Go here, do stuff')
                done()
            }
            socket.send('xmpp.command.do', { node: 'config' }, callback)
        })

    })

    describe('Multiple stage results', function() {

        it('Handles \'actions\'', function(done) {
            xmpp.once('stanza', function() {
                manager.makeCallback(
                    helper.getStanza('actions')
                )
            })
            var callback = function(error, data) {
                should.not.exist(error)
                data.actions.should.exist
                data.actions.execute.should.equal('next')
                data.actions.values.length.should.equal(2)
                data.actions.values.should.eql([ 'prev', 'next' ])
                done()
            }
            socket.send('xmpp.command.do', { node: 'config' }, callback)
        })

        it('Handles \'note\'', function(done) {
            xmpp.once('stanza', function() {
                manager.makeCallback(
                    helper.getStanza('note')
                )
            })
            var callback = function(error, data) {
                should.not.exist(error)
                data.note.type.should.equal('info')
                data.note.description.should.equal(
                    'Service \'httpd\' has been configured.'
                )
                done()
            }
            socket.send('xmpp.command.do', { node: 'config' }, callback)
        })

        it('Adds data form as expected', function(done) {
            var request = {
                node: 'config',
                form: [
                    { label: 'user', type: 'string', value: 'true' }
                ]
            }
            xmpp.once('stanza', function(stanza) {
                var x = stanza.getChild('command').getChild('x', dataForm.NS)
                x.should.exist
                x.attrs.type.should.equal('submit')
                var fields = x.getChildren('field')
                fields.length.should.equal(request.form.length)
                fields[0].attrs.label.should.equal(request.form[0].label)
                fields[0].attrs.type.should.equal(request.form[0].type)
                fields[0].getChildText('value')
                    .should.equal(request.form[0].value)
                done()
            })
            socket.send('xmpp.command.do', request, function() {})
        })

    })
    
    describe('Session IDs issue#3', function() {
    
        it('Includes a session ID in the response', function(done) {
            xmpp.once('stanza', function() {
                manager.makeCallback(
                    helper.getStanza('result-execute-data-form')
                )
            })
            var callback = function(error, data) {
                should.not.exist(error)
                data.sessionId.should.equal('list:20020923T213616Z-700')
                done()
            }
            socket.send('xmpp.command.do', { node: 'config' }, callback)
        })
        
        it('Allows user to set a session ID', function(done) {
            var request = { node: 'config', sessionId: 'list:20020923T213616Z-700' }
            xmpp.once('stanza', function(stanza) {
                stanza.getChild('command')
                    .getAttr('sessionid')
                    .should.equal(request.sessionId)
                done()
            })
            socket.send('xmpp.command.do', request, function() {})
        })
        
    })

})
