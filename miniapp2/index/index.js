const app = getApp();
// touch事件处理的js
const TouchEvent = require('../plugs/touchEvent.js');
// 照片合成处理的js
const Camera = require('../plugs/camera.js');
// 一些数学方法的js
const imath = require('../plugs/math.js');
// 照片的放大倍数，使照片清晰度变高，再图片分辨率非常高的情况下，值越高生成的图片越清晰，建议值为2
const imgscale = 2;

// 照片合成的对象
let ICamera;

// 编辑icon的数据格式
// {
//   act: Boolean,         选中状态
//   top: Number,          距离顶部距离
//   left: Number,         距离左部距离
//   width: Number,        宽度
//   height: Number,       高度
//   rotate: Number,       旋转角度，旋转中心为图片中心
//   zIndex: Number,       层级，越高越在前面
//   scale: Number,        缩放，暂时没用到
//   index: Number,        编号
//   src: String           icon图片地址
// }

Page({
  data: {
    baseImg: "/images/base.jpg",//基础图片
    scrollDis: 0,               //icons容器的移动距离
    editIcons: [],              //编辑的icon数据
    choseIcons: []              //选择的icons列表
  },
  onLoad: function () {
    var arr = [];
    for (let i = 0; i < 7; i++) {
      arr.push(i + 1);
    }
    this.setData({
      choseIcons: arr
    });
    this.touchInit();
  },
  /**
   * 选择图片
   */
  choseImg(){
    var that = this;
    wx.chooseImage({
      count:1,
      success(res){
        that.setData({
          baseImg:res.tempFilePaths[0]
        })
      }
    });
  },
  /**
   * touch事件初始化
   */
  touchInit: function () {
    var that = this;
    var itouch = new TouchEvent();
    itouch.init(that);
    itouch.bind({
      onRotate: (e) => {
        that.updateIconRotate(e);
      },
      onPinch: (e) => {
        that.updateIconScale(e);
      },
      onPressMove: (e) => {
        that.updateIconXY(e);
      }
    })
  },
  /**
   * 旋转icon
   */
  updateIconRotate(e) {
    var arr = this.data.editIcons;
    if (arr.length > 0) {
      var index = this.getActIcon(arr);
      var icon = arr[index];

      icon.rotate += e.angle;

      this.setData({
        editIcons: arr
      })
    }
  },
  /**
   * 缩放icon
   */
  updateIconScale(e) {
    var arr = this.data.editIcons;
    if (arr.length > 0) {
      var index = this.getActIcon(arr);
      var icon = arr[index];

      icon.scale += e.scale;
      icon.scale = icon.scale > 1.6 ? 1.6 : icon.scale;
      icon.scale = icon.scale < 0.5 ? 0.5 : icon.scale;
      icon.width = 400 * icon.scale;
      icon.height = 400 * icon.scale;

      this.setData({
        editIcons: arr
      })
    }
  },
  /**
   * 更新icon位置
   */
  updateIconXY(e) {
    var arr = this.data.editIcons;
    if (arr.length > 0) {
      var index = this.getActIcon(arr);
      var icon = arr[index];

      icon.top += e.deltaY;
      icon.left += e.deltaX;

      this.setData({
        editIcons: arr
      })
    }
  },
  /**
   * 获取激活状态的按钮
   */
  getActIcon(arr) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].act) return i;
    }
  },
  /**
   * 选中icon
   */
  choseIcon(e) {
    var arr = this.data.editIcons;
    var index = this.getActIcon(arr);
    arr[index].act = false;
    arr[index].z = 1;
    var id = e.currentTarget.dataset.id;
    var item = arr[id];
    item.act = true;
    item.z = 999;

    this.setData({
      editIcons: arr
    })
  },
  /**
   * 移除icon
   */
  removeIcon(e) {
    var arr = this.data.editIcons;
    var id = e.currentTarget.dataset.id;
    arr.splice(id, 1);
    if (arr.length > 0) {
      arr[arr.length - 1].act = true;
      arr[arr.length - 1].z = 2;
    }
    for (var i = 0; i < arr.length; i++) {
      arr[i].index = i;
    }

    this.setData({
      editIcons: arr
    })
  },
  /**
   * 添加icon
   */
  addIcon(e) {
    // console.log(e.currentTarget.dataset.id)
    var arr = this.data.editIcons;
    if (arr.length > 0) {
      var index = this.getActIcon(arr);
      arr[index].act = false;
      arr[index].zIndex = 1;
    }
    var item = {
      act: true,
      top: 255,
      left: 175,
      width: 400,
      height: 400,
      rotate: 0,
      zIndex: 2,
      scale: 1,
      index: arr.length,
      src: "/images/sicons/" + e.currentTarget.dataset.id + ".png"
    };
    arr.push(item);
    this.setData({
      editIcons: arr
    });
  },
  /**
   * 制作合成的照片
   */
  makePhoto() {
    wx.showLoading({
      title: "制作中...",
      mask: true
    });
    ICamera = new Camera('upload-canvas', this, {
      width: 750 * imgscale,
      height: 911 * imgscale
    });
    this.setBaseImg();
    this.setIcons();
    this.creatImg();
  },
  /**
   * 设置底图
   */
  setBaseImg() {
    var type = this.data.type;
    var img = this.data.baseImg;
    var x = 0;
    var y = 0;
    var w = 750;
    var h = 911;
    //获取基础图片信息，调整图片大小和位置
    wx.getImageInfo({
      src: img,
      success: (imgInfoRes) => {
        var opts = imath.autoSize([imgInfoRes.width, imgInfoRes.height], [750, 911], 1);
        if (opts[1] > 911) {
          y = -(opts[1] - 911) / 2;
        }
        else {
          x = -(opts[0] - 750) / 2;
        }
        w = opts[0];
        h = opts[1];
        ICamera.addItem(img, {
          width: w * imgscale,
          height: h * imgscale,
          x: x * imgscale,
          y: y * imgscale,
          rotation: 0,
          scale: 1
        });
      }
    });
  },
  /**
   *  设置icons
   */
  setIcons() {
    var icons = this.data.editIcons;
    for (let i = 0; i < icons.length; i++) {
      let icon = icons[i];
      ICamera.addItem(icon.src, {
        width: icon.width * imgscale,
        height: icon.height * imgscale,
        x: icon.left * imgscale,
        y: icon.top * imgscale,
        rotation: icon.rotate,
        scale: 1
      });
    }
  },
  /**
   * 生成图片
   */
  creatImg() {
    var that = this;
    setTimeout(function () {
      ICamera.getImage("jpg", 1, (src) => {
        wx.previewImage({
          urls:[src],
          current:src
        });
      })
    }, 1500);
  },
  /**
   * 左移
   */
  moveL() {
    var dis = this.data.scrollDis;
    if(dis >= 0){
      dis -= 104;
      dis = dis < 0 ? 0 : dis;
      this.setData({
        scrollDis: dis
      });
    }
  },

  /**
   * 右移
   */
  moveR() {
    var dis = this.data.scrollDis;
    if(dis < 100){
      dis += 104;
      dis = dis > 100 ? 100 : dis;
      this.setData({
        scrollDis: dis
      });
    }
  },
})
