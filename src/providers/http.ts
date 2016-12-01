import { Http as HttpAngular, Response } from '@angular/http';
import { Injectable, Optional } from '@angular/core';
import { HttpEvents, Events } from './backend/xhr_backend';
import { Plugins, Plugin } from './plugins';
import { ResponseOptions } from './response-options';
import { Observable } from 'rxjs/Observable';
import { Request } from '@ramonornela/url-resolver';
import { Mapper } from './mapper';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/defer';
import 'rxjs/add/operator/timeoutWith';
import 'rxjs/add/operator/map';

@Injectable()
export class Http {

  constructor(protected http: HttpAngular,
              protected events: Events,
              protected plugins: Plugins,
              @Optional() protected requestFactory: Request) {

    this.runEvent(HttpEvents.PRE_REQUEST, 'preRequest');
    this.runEvent(HttpEvents.POST_REQUEST, 'postRequest');
    this.runEvent(HttpEvents.POST_REQUEST_SUCCESS, 'postRequestSuccess');
    this.runEvent(HttpEvents.POST_REQUEST_ERROR, 'postRequestError');
  }

  request(url: any, params?: Object, options?: any, responseOptions?: ResponseOptions): Observable<Response> {

    if ( options && this.checkForResponseOptions(options) ) {
      responseOptions = options;
      options = null;
    }

    responseOptions = responseOptions || {};

    if ( typeof url === 'string' && this.requestFactory ) {
      if ( this.requestFactory.getMetadata().has(url) ) {
        url = this.requestFactory.create(url, params, options);
        options = null;
      }
    }

    let responseObservable = this.http.request(url, options);

    let mapper: Mapper = responseOptions.mapper;
    if ( mapper instanceof Mapper ) {
      responseObservable.map((resp) => mapper.transform(resp));
    }

    return responseObservable;
  }

  get(url: any, params?: Object, options?: any, responseOptions?: ResponseOptions): Observable<Response> {
    options = options || {};
    options.method = 'GET';
    return this.request(url, params, options, responseOptions);
  }

  post(url: any, params?: Object, options?: any, responseOptions?: ResponseOptions): Observable<Response> {
    options = options || {};
    options.method = 'POST';
    return this.request(url, params, options, responseOptions);
  }

  put(url: any, params?: Object, options?: any, responseOptions?: ResponseOptions): Observable<Response> {
    options = options || {};
    options.method = 'PUT';
    return this.request(url, params, options, responseOptions);
  }

  delete(url: any, params?: Object, options?: any, responseOptions?: ResponseOptions): Observable<Response> {
    options = options || {};
    options.method = 'DELETE';
    return this.request(url, params, options, responseOptions);
  }

  patch(url: any, params?: Object, options?: any, responseOptions?: ResponseOptions): Observable<Response> {
    options = options || {};
    options.method = 'PATCH';
    return this.request(url, params, options, responseOptions);
  }

  head(url: any, params?: Object, options?: any, responseOptions?: ResponseOptions): Observable<Response> {
    options = options || {};
    options.method = 'HEAD';
    return this.request(url, params, options, responseOptions);
  }

  private checkForResponseOptions(obj: any): boolean {

    let properties = [ 'mapper', 'promise', 'timeout' ];
    for ( let prop of properties ) {
      if ( prop in obj ) {
        return true;
      }
    }

    return false;
  }

  getPlugins(): Plugins {
    return this.plugins;
  }

  getPlugin(name: string): Plugin | null {
    return this.getPlugins().get(name);
  }

  setDefaultOptions(options: any): this {
    if (!this.requestFactory) {
      throw new Error('Called not permited, need import the module UrlResolverModule in root module');
    }
    this.requestFactory.setDefaultOptions(options);
    return this;
  }

  onPreRequest(callback: (req?: any) => any) {
    this.events.subscribe(HttpEvents.PRE_REQUEST, callback);
  }

  onPostRequest(callback: (req?: any) => any) {
    this.events.subscribe(HttpEvents.POST_REQUEST, callback);
  }

  onPostRequestSuccess(callback: (req?: any) => any) {
    this.events.subscribe(HttpEvents.POST_REQUEST_SUCCESS, callback);
  }

  onPostRequestError(callback: (req?: any) => any) {
    this.events.subscribe(HttpEvents.POST_REQUEST_ERROR, callback);
  }

  private runEvent(subscribe: string, method: string) {
    this.events.subscribe(subscribe, (req: any) => {
      this.plugins.forEach((plugin: any) => {
        // workaround typescript not exists verification of interfaces
        if (!(method in plugin)) {
          return;
        }

        let stop = plugin[method](req);

        if (stop === false) {
          this.events.stop();
        }
      });
    });
  }
}
