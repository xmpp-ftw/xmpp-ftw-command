'use strict';

var Base    = require('xmpp-ftw').Base
  , Disco   = require('xmpp-ftw-disco')

var Command = function() {
    this.disco = new Disco()
}

Command.prototype = new Base()

Command.prototype.NS = 'http://jabber.org/protocol/commands'

Command.prototype._events = {
    'xmpp.command.list': 'listCommands',
    'xmpp.command.info': 'commandInfo'
}

var init = Command.prototype.init

Command.prototype.init = function(manager) {
    init.call(this, manager)
    this.disco.init(manager, true)
}

Command.prototype.handles = function() {
    return false
}

Command.prototype.handle = function() {
    return false
}

Command.prototype.listCommands = function(data, callback) {
    data.node = this.NS
    if (!data.of) data.of = this.manager.fullJid.getDomain()
    var newCallback
    if ('function' === typeof callback) {
        newCallback = function(error, data, rsm) {
            if (error) return callback(error)
            data.forEach(function(item, index) {
                delete data[index].jid
            })
            callback(error, data, rsm)
        }
    }
    this.disco.getItems(data, newCallback || callback)
}

Command.prototype.commandInfo = function(data, callback) {
    if (!data.of) data.of = this.manager.fullJid.getDomain()
    if (typeof callback !== 'function') {
        return this._clientError('Missing callback', data)
    }
    if (!data.node) {
        return this._clientError('Missing \'node\' key', data, callback)
    }
    if (!data.of) data.of = this.manager.fullJid.getDomain()
    this.disco.getFeatures(data, callback)
}

module.exports = Command