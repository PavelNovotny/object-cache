/**
 *
 * Created by pavelnovotny on 02.10.15.
 */

var objectCache = require("../lib/object-cache.js");
var fs = require("fs");
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "testFdCache"});
log.level("info");

describe('objectCacheTest', function() {
    describe('#fdCache', function() {
        it('should store to the cache, should create waitingCallbacks', function(done) {
            objectCache.init({ttl:1500, checkperiod:100});
            for (var i = 0; i < 100; i++) {
                objectCache.getObject("object1", createObjectOK,["param1",0,"xxxx"], 500, function (err, object) {
                    log.info("getting object '"+ object +"'");
                });
            }
            setTimeout(function () {for (var i = 0; i < 100; i++) {
                objectCache.getObject("object1", createObjectOK,{param1:"param"}, 200, function (err, object) {
                    log.info("getting object '"+ object +"'");
                });
            }}, 300);
            setTimeout(function () {for (var i = 0; i < 100; i++) {
                objectCache.getObject("object1", createObjectOK, [], 200, function (err, object) {
                    log.info("getting object '"+ object +"'");
                });
            }}, 1000);
        });
    //     it('should expire and create new cache', function(done) {
    //         setTimeout(function () {for (var i = 0; i < 100; i++) {
    //             objectCache.getFd(testFile, function(err, fd) {
    //                 log.info("file delayed opened "+ fd);
    //             });
    //         }}, 1500);
    //     });
     });

});

function createObjectOK(params, callback) {
    setTimeout(function () {
        log.info("creating OK object");
        callback(null, "OK object");
    }, 150);
}

function createObjectNOK(params, callback) {
    setTimeout(function () {
        log.info("creating NOK object");
        callback("Error creating object", "NOK object created");
    }, 150);
}

