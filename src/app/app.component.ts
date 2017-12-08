import {Component, OnInit, ViewChild} from '@angular/core';
import {Utils} from './utils/utils';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {Markers} from './model/markers';

declare var AMap: any;
declare var ActiveXObject: any;
declare global {
  interface Document {
    mozCancelFullScreen(): void;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
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

  markers = [];
  markersData = [];

  panelState = 'hide';

  toggleButton = '<';

  currentRegionName = '桂林市'; // 当前显示的区域名称

  administrativeRegion = [{
    name: '桂林市',
    center: '110.29002, 25.27361'
  }, {
    name: '秀峰区',
    center: '110.264183,25.273625'
  }, {
    name: '叠彩区',
    center: '110.30188,25.31402'
  }, {
    name: '象山区',
    center: '110.28110,25.26159'
  }, {
    name: '七星区',
    center: '110.322224,25.252701'
  }, {
    name: '雁山区',
    center: '110.28669,25.101935'
  }, {
    name: '临桂区',
    center: '110.212463,25.238628'
  }];

  heatmapData = [];
  district;
  districtPolygons = [];

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

  constructor() {
  }

  ngOnInit() {
    this.markersData = [...Markers]; // 获取 marker 数据

    // 异步加载地图
    Utils.loadAMap().subscribe(success => {
      if (success) {
        this.initMap();
        this.loadMarker();

        // 信息窗体实例化
        this.infoWindow = new AMap.InfoWindow({
          isCustom: true,  // 使用自定义窗体
          content: this.createInfoWindow.nativeElement,
          offset: new AMap.Pixel(0, -40)
        });
      }
    });
  }

  // 初始化地图
  initMap() {
    this.initHeatmapData();

    this.map = new AMap.Map('mapContainer', {
      resizeEnable: true,
      center: [110.29002, 25.27361]
    });

    this.initFullscreenEvent();

    this.initMapService();
  }

  // 初始化热力图数据
  initHeatmapData() {
    this.heatmapData = [];
    const markerDatas = [...this.markersData];
    for (const item of markerDatas) {
      const lnglat = item.split(',');
      this.heatmapData.push({
        lng: lnglat[0],
        lat: lnglat[1]
      })
    }
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
      this.heatmap.setDataSet({data: this.heatmapData}); // 设置热力图数据集
    });

    AMap.service('AMap.MarkerClusterer', () => {
      this.cluster = new AMap.MarkerClusterer(this.map, this.markers, {styles: this.sts, gridSize: 80});
    });
  }

  // 显示或隐藏 markers
  showOrHideMarker(ev) {
    const checked = ev.target.checked;
    if (checked) {
      this.cluster.addMarkers(this.markers);
    } else {
      this.cluster.removeMarkers(this.markers);
    }
  }

  // 显示或隐藏 heatmap
  showOrHideHeatmap(ev) {
    const checked = ev.target.checked;
    if (checked) {
      this.heatmap.show();
    } else {
      this.heatmap.hide();
    }
  }

  // 显示或隐藏 panel
  showOrHidePanel() {
    this.panelState = this.panelState === 'hide' ? 'show' : 'hide';
    this.toggleButton = this.panelState === 'hide' ? '<' : '>'
  }

  // 加载 marker
  loadMarker() {
    this.markers = [];
    for (const item of this.markersData) {
      const marker = new AMap.Marker({
        position: item.split(','),
      });
      // 鼠标点击marker弹出自定义的信息窗体
      marker.on('click', () => {
        console.log(this.infoWindow);
        this.infoWindow.open(this.map, marker.getPosition());
      });
      this.markers.push(marker);
    }
    this.cluster.addMarkers(this.markers);
    console.log('点标注加载成功'); // 加载完数据的处理
  }

  // 显示行政区域
  showDistrict(ev, region) {
    this.currentRegionName = region.name;
    if (ev.target.checked) {
      this.drawDistrict(region.name);
    }
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
    const element = this.wrapper.nativeElement;
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
    // this.map.destroy();
    if (this.is3DHeatmap) {
      this.initMap();
      this.drawDistrict(this.currentRegionName);
      this.is3DHeatmap = false;
      this.heatmapPattern = '热力图3D模式';
    } else {
      // this.cluster.clearMarkers();
      this.init3DHeatmap();
      this.is3DHeatmap = true;
      this.heatmapPattern = '普通地图';
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
    const heatmap3D = new AMap.Heatmap(this.map, heatmapOpts);

    const heatmapDatas = [];

    for (const item of this.markersData) {
      const lnglat = item.split(',');
      heatmapDatas.push({
        lng: lnglat[0],
        lat: lnglat[1]
      })
    }

    heatmap3D.setDataSet({
      data: heatmapDatas,
    });
  }

  // 关闭信息窗体
  closeInfoWindow() {
    this.infoWindow.close();
  }

}


