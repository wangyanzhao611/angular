var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from 'angular2/src/core/di';
import { Map, MapWrapper } from 'angular2/src/facade/collection';
import { CONST, CONST_EXPR } from 'angular2/src/facade/lang';
import { BaseException } from 'angular2/src/facade/exceptions';
import { NgZone } from '../zone/ng_zone';
import { PromiseWrapper, ObservableWrapper } from 'angular2/src/facade/async';
/**
 * The Testability service provides testing hooks that can be accessed from
 * the browser and by services such as Protractor. Each bootstrapped Angular
 * application on the page will have an instance of Testability.
 */
export let Testability = class {
    constructor(_ngZone) {
        /** @internal */
        this._pendingCount = 0;
        /** @internal */
        this._callbacks = [];
        /** @internal */
        this._isAngularEventPending = false;
        this._watchAngularEvents(_ngZone);
    }
    /** @internal */
    _watchAngularEvents(_ngZone) {
        ObservableWrapper.subscribe(_ngZone.onTurnStart, (_) => { this._isAngularEventPending = true; });
        _ngZone.runOutsideAngular(() => {
            ObservableWrapper.subscribe(_ngZone.onEventDone, (_) => {
                if (!_ngZone.hasPendingTimers) {
                    this._isAngularEventPending = false;
                    this._runCallbacksIfReady();
                }
            });
        });
    }
    increasePendingRequestCount() {
        this._pendingCount += 1;
        return this._pendingCount;
    }
    decreasePendingRequestCount() {
        this._pendingCount -= 1;
        if (this._pendingCount < 0) {
            throw new BaseException('pending async requests below zero');
        }
        this._runCallbacksIfReady();
        return this._pendingCount;
    }
    isStable() { return this._pendingCount == 0 && !this._isAngularEventPending; }
    /** @internal */
    _runCallbacksIfReady() {
        if (!this.isStable()) {
            return; // Not ready
        }
        // Schedules the call backs in a new frame so that it is always async.
        PromiseWrapper.resolve(null).then((_) => {
            while (this._callbacks.length !== 0) {
                (this._callbacks.pop())();
            }
        });
    }
    whenStable(callback) {
        this._callbacks.push(callback);
        this._runCallbacksIfReady();
    }
    getPendingRequestCount() { return this._pendingCount; }
    // This only accounts for ngZone, and not pending counts. Use `whenStable` to
    // check for stability.
    isAngularEventPending() { return this._isAngularEventPending; }
    findBindings(using, provider, exactMatch) {
        // TODO(juliemr): implement.
        return [];
    }
    findProviders(using, provider, exactMatch) {
        // TODO(juliemr): implement.
        return [];
    }
};
Testability = __decorate([
    Injectable(), 
    __metadata('design:paramtypes', [NgZone])
], Testability);
export let TestabilityRegistry = class {
    constructor() {
        /** @internal */
        this._applications = new Map();
        _testabilityGetter.addToWindow(this);
    }
    registerApplication(token, testability) {
        this._applications.set(token, testability);
    }
    getTestability(elem) { return this._applications.get(elem); }
    getAllTestabilities() { return MapWrapper.values(this._applications); }
    findTestabilityInTree(elem, findInAncestors = true) {
        return _testabilityGetter.findTestabilityInTree(this, elem, findInAncestors);
    }
};
TestabilityRegistry = __decorate([
    Injectable(), 
    __metadata('design:paramtypes', [])
], TestabilityRegistry);
let _NoopGetTestability = class {
    addToWindow(registry) { }
    findTestabilityInTree(registry, elem, findInAncestors) {
        return null;
    }
};
_NoopGetTestability = __decorate([
    CONST(), 
    __metadata('design:paramtypes', [])
], _NoopGetTestability);
export function setTestabilityGetter(getter) {
    _testabilityGetter = getter;
}
var _testabilityGetter = CONST_EXPR(new _NoopGetTestability());