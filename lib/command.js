'use strict';

var builder    = require('ltx')
  , Base       = require('xmpp-ftw').Base

var Command = function() {}

Command.prototype = new Base()

Command.prototype.NS = 'http://jabber.org/protocol/commands'

Command.prototype._events = {}

Command.prototype.handles = function(stanza) {
    return false
}

Command.prototype.handle = function(stanza) {
    return false
}

module.exports = Command