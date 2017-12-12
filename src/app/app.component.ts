import {Component, OnInit, ViewChild} from '@angular/core';
import {Utils} from './utils/utils';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {AppService} from './services/app.service';
import {Regions} from './model/regions';
import {Observable} from 'rxjs/Rx';
import {Query} from './model/query.model';
import {BizType} from './model/biz-type';
import {PowerCutData} from './model/markers';

declare var AMap: any;
declare var ActiveXObject: any;
declare global {
  interface Document {
    mozCancelFullScreen(): void;
  }

  interface HTMLBodyElement {
    mozRequestFullScreen(): void;

    msRequestFullscreen(): void
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('panelToggle', [
      state('show', style({
        right: '0'
      })),
      state('hide', style({
        right: '-350px'
      })),
      transition('hide => show', animate('500ms ease-in')),
      transition('show => hide', animate('200ms ease-out'))
    ])
  ]
})
export class AppComponent implements OnInit {
  @ViewChild('wrapper') wrapper;
  @ViewChild('createInfoWindow') createInfoWindow;
  @ViewChild('regionForm') regionForm;

  map;
  fullscreen = false;
  toggleFullScreenButton = '全屏';
  heatmap; // 热力图对象
  cluster; // marker 聚合对象
  infoWindow; // 信息窗体
  heatmapPattern = '热力图3D模式';
  is3DHeatmap = false;

  dataType = 'appeal';
  data = [];
  query: Query = {}; // 查询数据条件
  markers = [];

  powerCutData = []; // 停电数据
  powerCutRegoin = []; // 停电区域
  powerCutRegoinData = {}; // 停电区域数据

  panelState = 'hide';
  isShowMarker = true;
  isShowHeatmap = true;
  isShowMonthpanel = false;

  toggleButton = '<';

  currentRegionName = '桂林市'; // 当前显示的区域名称
  regionValue = '';

  regions;

  appealType = [];
  selectedAppealType;

  heatmapData = [];
  district;
  districtPolygons = [];

  timeLineData = [{
    label: '1月',
    value: 1,
    checked: true
  }, {
    label: '2月',
    value: 2,
    checked: false
  }, {
    label: '3月',
    value: 3,
    checked: false
  }, {
    label: '4月',
    value: 4,
    checked: false
  }, {
    label: '5月',
    value: 5,
    checked: false
  }, {
    label: '6月',
    value: 6,
    checked: false
  }, {
    label: '7月',
    value: 7,
    checked: false
  }, {
    label: '8月',
    value: 8,
    checked: false
  }, {
    label: '9月',
    value: 9,
    checked: false
  }, {
    label: '10月',
    value: 10,
    checked: false
  }, {
    label: '11月',
    value: 11,
    checked: false
  }, {
    label: '12月',
    value: 12,
    checked: false
  }];

  marks = {
    1: '1月',
    2: '2月',
    3: '3月',
    4: '4月',
    5: '5月',
    6: '6月',
    7: '7月',
    8: '8月',
    9: '9月',
    10: '10月',
    11: '11月',
    12: '12月',
  };
  currentMonth: number;

  timeRangeLeft = 0;

  private sts = [{
    url: 'http://a.amap.com/jsapi_demos/static/images/blue.png',
    size: new AMap.Size(32, 32),
    offset: new AMap.Pixel(-16, -16)
  }, {
    url: 'http://a.amap.com/jsapi_demos/static/images/green.png',
    size: new AMap.Size(32, 32),
    offset: new AMap.Pixel(-16, -16)
  }, {
    url: 'http://a.amap.com/jsapi_demos/static/images/orange.png',
    size: new AMap.Size(36, 36),
    offset: new AMap.Pixel(-18, -18)
  }, {
    url: 'http://a.amap.com/jsapi_demos/static/images/red.png',
    size: new AMap.Size(48, 48),
    offset: new AMap.Pixel(-24, -24)
  }, {
    url: 'http://a.amap.com/jsapi_demos/static/images/darkRed.png',
    size: new AMap.Size(48, 48),
    offset: new AMap.Pixel(-24, -24)
  }];

  constructor(private service: AppService) {
  }

  ngOnInit() {
    this.initPowerCutData();

    this.regions = [...Regions];
    this.appealType = [...BizType];
    this.currentMonth = new Date().getMonth() + 1;

    this.loadMapData().subscribe((res) => {
      this.data = res[0].data;
      this.loadMarker();
      this.loadHeatmapData();
    });
  }

  // 初始化停电数据
  initPowerCutData() {
    this.powerCutData = [...PowerCutData];

    // 删除数据空格
    for (const item of this.powerCutData) {
      for (const key in item) {
        if (item[key]) {
          item[key] = item[key].replace(/\s+/g, '');
        }
      }
    }

    // 按地区组装数据
    for (const item of this.powerCutData) {
      const key = item.zoneID;
      if (!this.powerCutRegoinData[key]) {
        this.powerCutRegoinData[key] = [item];
      } else {
        this.powerCutRegoinData[key].push(item);
      }
    }

    this.powerCutRegoin = [...Object.keys(this.powerCutRegoinData)];
    console.log(this.powerCutRegoin);
  }

  // 加载地图和获取marker数据
  loadMapData() {
    return Observable.zip(this.service.getData({}), this.loadMap());
  }

  // 异步加载地图
  loadMap() {
    return Observable.create(observable => {
      Utils.loadAMap().subscribe(success => {
        if (success) {
          observable.next(true);
          this.initMap();

          // 信息窗体实例化
          this.infoWindow = new AMap.InfoWindow({
            isCustom: true,  // 使用自定义窗体
            content: this.createInfoWindow.nativeElement,
            offset: new AMap.Pixel(0, -40)
          });
        }
      });
    })
  }

  // 获取数据
  getData(query: Query = {}) {
    this.data = [];

    // if(this.)

    this.service.getData(query).subscribe(({data}) => {
      this.data = data;
      console.log(data);
      if (this.is3DHeatmap) {
        this.init3DHeatmap();
      } else {
        this.loadMarker();
        this.loadHeatmapData();
      }
    });
  }

  // 初始化地图
  initMap() {
    this.mapInstance();

    this.initFullscreenEvent();
  }

  private mapInstance() {
    this.map = new AMap.Map('mapContainer', {
      resizeEnable: true,
      center: [110.29002, 25.27361]
    });

    this.initMapService(); // 区别于3d热力图
  }

  // 加载热力图数据
  loadHeatmapData() {
    this.heatmapData = [];
    for (const item of this.data) {
      this.heatmapData.push({
        lng: item.longitude,
        lat: item.latitude
      })
    }
    this.heatmap.setDataSet({data: this.heatmapData}); // 设置热力图数据集
  }

  // 地图插件初始化
  initMapService() {
    // 加载行政区搜索插件
    AMap.service('AMap.DistrictSearch', () => {
      // 市的下一级行政区
      this.district = new AMap.DistrictSearch({
        level: 'district',
        subdistrict: 1,
        extensions: 'all',  // 返回行政区边界坐标组等具体信息
      });
      this.drawDistrict(this.currentRegionName); // 默认显示桂林市区域
    });

    // 加载热力图插件
    AMap.plugin(['AMap.Heatmap', 'AMap.ControlBar'], () => {
      this.heatmap = new AMap.Heatmap(this.map);    // 在地图对象叠加热力图
    });

    // 构造点聚合对象
    AMap.service('AMap.MarkerClusterer', () => {
      this.cluster = new AMap.MarkerClusterer(this.map, this.markers, {styles: this.sts, gridSize: 80});
    });
  }

  // 加载 marker
  loadMarker() {
    this.cluster.clearMarkers();
    this.markers = [];
    for (const item of this.data) {
      const lnglat = [item.longitude, item.latitude]; // 经纬度数据
      const marker = new AMap.Marker({
        position: lnglat,
      });
      // 鼠标点击marker弹出自定义的信息窗体
      marker.on('click', () => {
        this.infoWindow.open(this.map, marker.getPosition());
      });
      this.markers.push(marker);
    }
    this.cluster.addMarkers(this.markers);

    console.log('点标注加载成功'); // 加载完数据的处理
  }

  // 显示或隐藏 markers
  showOrHideMarker(ev) {
    if (ev) {
      this.cluster.addMarkers(this.markers);
    } else {
      this.cluster.removeMarkers(this.markers);
    }
  }

  // 显示或隐藏 heatmap
  showOrHideHeatmap(ev) {
    if (ev) {
      this.heatmap.show();
    } else {
      this.heatmap.hide();
    }
  }

  // 显示或隐藏月份 panel
  showOrHideMonthpanel(ev) {
    if (ev) {
      this.changeMonth();
    } else {
      this.query.endTime = '';
      this.getData(this.query);
    }
  }

  // 显示或隐藏 panel
  showOrHidePanel() {
    this.panelState = this.panelState === 'hide' ? 'show' : 'hide';
    this.toggleButton = this.panelState === 'hide' ? '<' : '>'
  }

  // 显示和切换区局
  showDistrict() {
    const regionName = this.regions.find(region => region.value === this.regionValue).regionName;
    this.query.zoneID = this.regionValue;
    this.getData(this.query);
    this.drawDistrict(regionName);
  }

  // 绘制行政区域
  drawDistrict(district?) {
    if (!district) {
      return false;
    }
    this.district.search(district, (status, result) => {
      if (status === 'complete') {
        const bounds = result.districtList[0].boundaries;
        this.removePolygon();
        if (bounds) {
          for (const bound of bounds) {
            // 生成行政区划polygon
            const polygon = new AMap.Polygon({
              map: this.map,
              strokeWeight: 2,
              path: bound,
              fillOpacity: 0.2,
              fillColor: '#CCF3FF',
              strokeColor: '#258de6'
            });
            this.districtPolygons.push(polygon);
          }
          this.map.setFitView(); // 地图自适应
        }
      }
    });
  }

  // 清除地图上已经绘制的区域
  private removePolygon() {
    for (const polygon of this.districtPolygons) {
      polygon.setMap(null);
    }
    this.districtPolygons = [];
  }

  // 初始化全屏事件
  initFullscreenEvent() {
    // Fullscreen event listener
    const fullscreenEvents = [
      'fullscreenchange',
      'mozfullscreenchange',
      'webkitfullscreenchange',
      'msfullscreenchange'
    ];

    fullscreenEvents.forEach(eventName => {
      document.addEventListener(eventName, () => {
        this.fullscreen = !this.fullscreen;
      });
    });
  }

  // 地图全屏切换
  toggleFullScreen() {
    if (this.fullscreen) {
      this.exitFullscreen();
      this.toggleFullScreenButton = '全屏';
    } else {
      this.launchFullscreen();
      this.toggleFullScreenButton = '退出';
    }
  }

  // 全屏
  launchFullscreen() {
    const element = document.getElementsByTagName('body')[0];
    element.webkitRequestFullscreen();

    // const element = this.wrapper.nativeElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    } else if (typeof ActiveXObject !== 'undefined') {
      const wscript = new ActiveXObject('WScript.Shell');
      if (wscript !== null) {
        wscript.SendKeys('{F11}');
      }
    }
  }

  // 退出全屏
  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }

  // 切换热力图模式
  toggleHeapmatPattern() {
    if (this.is3DHeatmap) {
      this.is3DHeatmap = false;
      this.heatmapPattern = '热力图3D模式';

      this.mapInstance();
      this.getData();
    } else {
      this.is3DHeatmap = true;
      this.heatmapPattern = '普通地图';

      this.init3DHeatmap();
    }
  }

  // 初始化3D热力图
  init3DHeatmap() {
    this.map = new AMap.Map('mapContainer', {
      viewMode: '3D',
      pitch: 70,
      resizeEnable: true,
      center: [110.29002, 25.27361],
      zoom: 10
    });

    this.map.addControl(new AMap.ControlBar({position: {top: '50px', left: '50px'}}));

    const heatmapOpts = {
      // 3d 相关的参数
      '3d': {
        heightBezier: [0.33, 1.375, 0.767, 0.31], // 热度转高度的曲线控制参数，可以利用左侧的控制面板获取
        gridSize: 3, // 取样精度，值越小，曲面效果越精细，但同时性能消耗越大
        drawGridLine: true // 是否绘制网格线
      }
    };

    // 初始化heatmap对象
    this.heatmap = new AMap.Heatmap(this.map, heatmapOpts);

    const heatmapDatas = [];

    for (const item of this.data) {
      heatmapDatas.push({
        lng: item.longitude,
        lat: item.latitude
      })
    }

    this.heatmap.setDataSet({
      data: heatmapDatas,
    });
  }

  // 关闭信息窗体
  closeInfoWindow() {
    this.infoWindow.close();
  }

  // 选择月份
  selectMonth(item, index) {
    for (const time of this.timeLineData) {
      if (item.label === time.label) {
        time.checked = !time.checked;
      } else {
        time.checked = false;
      }
    }
    if (2 < index && index < 9) {
      this.timeRangeLeft = (index - 3) * (50) + 25;
    } else if (index >= 9) { // 临界点的left值
      this.timeRangeLeft = 300;
    } else if (index <= 2) { // 临界点的left值
      this.timeRangeLeft = 0;
    }
  }

  // 选择诉求类型
  selectAppealType() {
    console.log(this.query);
    this.query.bizType1Strings = this.selectedAppealType;
    this.getData(this.query);
  }

  // 改变查看数据的月份
  changeMonth() {
    const currentYear = new Date().getFullYear();
    this.query.endTime = `${currentYear}-${this.currentMonth}-01T01:01:01.755Z`;
    this.getData(this.query);
  }
}


