var fs = require('fs');
var bunyan = require('bunyan');

var log = bunyan.createLogger({name: "object-cache"});
log.level("info");

var objectCache = {};
var waitingCallbacks = {};
var checkInterval;
var ttl; //time to live in millis

exports.init = function (options) {
    ttl = options.ttl; //time to live in millis
    checkInterval = setInterval(checkData, options.checkperiod); //in millis
};

exports.getObject = function(objectId, getObjectFunction, objectFuncParams, objectTtl, callback) {
    var cachedObject = objectCache[objectId];
    if (cachedObject === undefined) {
        if (waitingCallbacks[objectId] === undefined) {
            waitingCallbacks[objectId] = []; //future interests
            getObjectFunction(objectFuncParams, function(err, object) {
                if (err) {
                    for (var i =0; i< waitingCallbacks[objectId].length; i++) {
                        waitingCallbacks[objectId][i](err); //zajistíme aby každý doposud zaregistrovaný callback obdržel error
                    }
                    delete waitingCallbacks[objectId]; //vyčistíme callbacky
                    return callback(err);
                }
                objectCache[objectId] = {object: object, lastUse: Date.now(), ttl: (objectTtl===null?ttl:objectTtl)};
                //mezitim mohly prijit dalsi pozadavky, ktere se akumulovaly do waitingCallbacks
                log.info("object returned "+ objectId +"| waitingCallback count " + waitingCallbacks[objectId].length);
                for (var i =0; i< waitingCallbacks[objectId].length; i++) {
                    waitingCallbacks[objectId][i](null, object);
                }
                delete waitingCallbacks[objectId]; //dočistíme vyřízené callbacky
                return callback(null, object); //puvodni callback, ktery jsme si na zacatku nevlozili do waitingCallbacks
            });
        } else { //načítání do cache již probíhá, až bude v cache, tak zpracujeme.
            log.debug("pushing callback for "+ objectId);
            waitingCallbacks[objectId].push(callback); //if not in cache, register for future callback
        }
    } else {
        log.info("returned cached object value for "+ objectId);
        cachedObject.lastUse = Date.now();
        return callback(null, cachedObject.object);
    }
}



function checkData() {
    log.info("checking data ");
    var objectsToDelete = [];
    for (var object in objectCache) {
        objectsToDelete.push(object);
    }
    var now = Date.now();
    for (var i=0; i< objectsToDelete.length; i++) {
        if (now - objectCache[objectsToDelete[i]].lastUse > objectCache[objectsToDelete[i]].ttl) {
            log.info("deleting cached object "+ objectsToDelete[i]);
            delete objectCache[objectsToDelete[i]];
        }
    }
};

