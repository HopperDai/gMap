import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';

declare global {
  interface Window {
    AMap: any;
    onAmapLoaded: Function;
  }
}

export class Utils {

  constructor() {
  }

  static isEmpty(value): boolean {
    return value === null || typeof value === 'string' && value.length === 0;
  }

  static isNotEmpty(value): boolean {
    return !Utils.isEmpty(value);
  }

  // 格式化「是」、「否」
  static formatYesOrNo(value: number | string | boolean): string {
    if (value === 0 || value === '0' || value === false) {
      return '否';
    }

    if (value === 1 || value === '1' || value === true) {
      return '是';
    }

    return '';
  }

  // 格式化日期
  static dateFormat(date: Date, sFormat: String = 'yyyy-MM-dd'): string {
    const time = {
      Year: 0,
      TYear: '0',
      Month: 0,
      TMonth: '0',
      Day: 0,
      TDay: '0',
      Hour: 0,
      THour: '0',
      hour: 0,
      Thour: '0',
      Minute: 0,
      TMinute: '0',
      Second: 0,
      TSecond: '0',
      Millisecond: 0
    };
    time.Year = date.getFullYear();
    time.TYear = String(time.Year).substr(2);
    time.Month = date.getMonth() + 1;
    time.TMonth = time.Month < 10 ? '0' + time.Month : String(time.Month);
    time.Day = date.getDate();
    time.TDay = time.Day < 10 ? '0' + time.Day : String(time.Day);
    time.Hour = date.getHours();
    time.THour = time.Hour < 10 ? '0' + time.Hour : String(time.Hour);
    time.hour = time.Hour < 13 ? time.Hour : time.Hour - 12;
    time.Thour = time.hour < 10 ? '0' + time.hour : String(time.hour);
    time.Minute = date.getMinutes();
    time.TMinute = time.Minute < 10 ? '0' + time.Minute : String(time.Minute);
    time.Second = date.getSeconds();
    time.TSecond = time.Second < 10 ? '0' + time.Second : String(time.Second);
    time.Millisecond = date.getMilliseconds();

    return sFormat.replace(/yyyy/ig, String(time.Year))
      .replace(/yyy/ig, String(time.Year))
      .replace(/yy/ig, time.TYear)
      .replace(/y/ig, time.TYear)
      .replace(/MM/g, time.TMonth)
      .replace(/M/g, String(time.Month))
      .replace(/dd/ig, time.TDay)
      .replace(/d/ig, String(time.Day))
      .replace(/HH/g, time.THour)
      .replace(/H/g, String(time.Hour))
      .replace(/hh/g, time.Thour)
      .replace(/h/g, String(time.hour))
      .replace(/mm/g, time.TMinute)
      .replace(/m/g, String(time.Minute))
      .replace(/ss/ig, time.TSecond)
      .replace(/s/ig, String(time.Second))
      .replace(/fff/ig, String(time.Millisecond));
  }

  // 获得自增序列
  static getSequence = (function () {
    let sequence = 100;
    return function () {
      return ++sequence;
    };
  })();

  // 从 set 中取出 subset 中对应 key 值的新对象
  static getSubset(subset, set): any {
    return Object.keys(subset).reduce((preSubset, key) => {
      preSubset[key] = set[key];
      return preSubset;
    }, {});
  }

  // 异步加载 js 脚本
  static loadScript(url: string, callback?, error?) {
    const script = document.createElement('script');
    script.type = 'text/javascript';

    script.onload = function () {
      if (callback instanceof Function) {
        callback();
      }
    };

    script.onerror = function () {
      if (error instanceof Function) {
        error();
      }
    };

    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
  }

  // 加载高德地图 js 文件
  static loadAMap(): Observable<boolean> {
    if (window.AMap) {
      return Observable.of(true);
    } else {
      return Observable.create(observable => {
        window.onAmapLoaded = function () {
          console.log('window.AMap is now available');
          console.log(window.AMap);
          console.log(window.AMap.DistrictSearch);
          observable.next(true);
        };

        const key = 'c3ad7c042decaaeebcc3c8b239df62e8';
        Utils.loadScript(`https://webapi.amap.com/maps?v=1.4.2&key=${key}&plugin=AMap.DistrictSearch&callback=onAmapLoaded`);
      });
    }
  }

  // 生成树状菜单
  static generateTreeFromList(list: Array<any>,
                              parentKey: string = 'parentId',
                              childrenKey: string = 'children'): Array<any> {
    const childrenList = {};
    const data = [];

    list.forEach(item => {
      if (item[parentKey] === 0) {
        data.push(item);
      } else {
        if (!childrenList[item[parentKey]]) {
          childrenList[item[parentKey]] = [];
        }

        childrenList[item[parentKey]].push(item);
      }
    });

    Utils.assignChildren(data, childrenList, childrenKey);

    return data;
  }

  // 递归调用，将子节点列表赋值到对应的 children 属性上
  static assignChildren(data: Array<any>, childrenList: object, childrenKey: string) {
    data.forEach(item => {
      // Note that j is string here
      for (const j in childrenList) {
        if (item.id === +j) {
          item[childrenKey] = childrenList[j];
          Utils.assignChildren(item.children, childrenList, childrenKey);
        }
      }
    });
  }
}
