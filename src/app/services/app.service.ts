import {Injectable} from '@angular/core';
import {Query} from '../model/query.model';
import {APP_SERVE_URL} from '../utils/constants';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class AppService {

  constructor(private http: Http) {
  }

  // 获取业务数据
  getData(query: Query = {}) {
    return this.http.post(APP_SERVE_URL + '/map/resource', query).map(res => res.json());
  }
}
