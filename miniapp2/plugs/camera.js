let imath = require('math.js');
let TouchEvent = require('touchEvent.js');
let VC = require('VCanvas.js');

/**
 * 图片拍照上传编辑
 * @param  {String}     id              cavnas-id
 * @param  {Page}       pageContext     当前的page对象
 * @param  {Object}     options         {width,height}
 */
var Camera = function (id, pageContext, options) {
    var s = this;

    let ctx, page, opts;

    //铺满画布的尺寸
    let size = {
        width: 0,
        height: 0
    };
    let scale;
    //缩放最大值
    let maxScale = 1.5;
    //缩放最小值
    let minScale = 0.5;
    //上传的图片数据
    let imgFileObj = null;

    //canvas
    let stage;
    //背景层
    let bgLayer = null;
    let itemLayer = null;
    let topLayer = null;

    //事件
    let touch = new TouchEvent();

    //压缩图
    let imgComp;

    let needResize = false;


    function _init() {
        ctx = wx.createCanvasContext(id);
        page = pageContext;
        opts = options;
        //根据px尺寸计算一下
        let sysInfo = wx.getSystemInfoSync();
        scale = sysInfo.windowWidth / 750;
        opts.width *= scale;
        opts.height *= scale;
        stage = new VC.Stage(ctx, opts.width, opts.height, { onDraw: _onDraw});
        //绑定事件
        // touch.init(page);
        // touch.bind({
        //     onPressMove: (e) => {
        //         bgLayer.x += e.deltaX;
        //         bgLayer.y += e.deltaY;
        //         stage.update();
        //         page.setData({
        //             touchStatus: 'onPressMove:' + e.deltaX + " - " + e.deltaY
        //         });
        //     },
        //     onRotate: (e) => {
        //         bgLayer.rotation += e.angle;
        //         stage.update();
        //         page.setData({
        //             touchStatus: 'onRotate:' + e.angle
        //         });
        //     },
        //     onPinch: (e) => {
        //         let scale = bgLayer.scaleX;
        //         scale += e.scale;
        //         if(scale > maxScale)scale = maxScale;
        //         if(scale < minScale)scale = minScale;
        //         bgLayer.scaleX = scale;
        //         bgLayer.scaleY = scale;
        //         stage.update();
        //         page.setData({
        //             touchStatus: 'onPinch:' + e.scale
        //         });
        //     }
        // });
    }
    //压缩完成
    function _imgCompComplete(){
        console.log('_imgCompComplete');
        let resizeImg = imgComp.getImage(imgFileObj.path);
        console.log(resizeImg);
        size.width = resizeImg.width;
        size.height = resizeImg.height;
        imgFileObj.path = resizeImg.path;
        _updateCanvas();
    }

    //绘制完成
    function _onDraw(){
        console.log('_onDraw');
        if(opts.onDraw) opts.onDraw();
    }

    //解析图片 
    function _parseImg(){
       let flag =  _parseSize();
        
    }

    //计算一下图片的宽高 铺满画布
    function _parseSize() {
        let sizeObj = imath.autoSize([imgFileObj.width, imgFileObj.height], [opts.width, opts.height], 1);
        //这里取整比较好
        size.width = Math.ceil(sizeObj[0])+5;
        size.height = Math.ceil(sizeObj[1])+5;
        if (imgFileObj.width > size.width && needResize){
            imgFileObj.sizeType = opts.width;
            imgComp.addImage(imgFileObj);
            imgComp.start();
        }else{
            _updateCanvas();
        }
    }

    function _updateCanvas() {
        console.log(size);
        if(bgLayer == null){
            bgLayer = new VC.Image();
            //添加到舞台并更新
            stage.addChild(bgLayer);
        }
        bgLayer.source = imgFileObj.path;
        _reset();
    }
    function _reset() {
        console.log(bgLayer);
        console.log(size);
        if (bgLayer){
            bgLayer.width = size.width;
            bgLayer.height = size.height;
            bgLayer.anchorX = size.width / 2;
            bgLayer.anchorY = size.height / 2;
            bgLayer.scaleX = bgLayer.scaleY = 1;
            bgLayer.rotation = 0;
            bgLayer.x = (opts.width - size.width) / 2;
            bgLayer.y = (opts.height - size.height) / 2;
            stage.update();
        }
    }
    function _clear(){
        imgFileObj.path = "";
        _updateCanvas();
    }
    /**
     * 选择图片
     */
    s.chooseImage = function (imgObj, resize) {
        needResize = resize;
        if (imgObj) {
            imgFileObj = imgObj;
            _parseSize();
            // this._updateCanvas(this.center.x, this.center.y);
        } else {
            wx.chooseImage({
                count: 1, // 默认9
                sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
                sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
                success: (res) => {
                    // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
                    var tempFilePaths = res.tempFilePaths;
                    if (tempFilePaths.length > 0) {
                        //计算一下图片
                        wx.getImageInfo({
                            src: tempFilePaths[0],
                            success: (imgInfoRes) => {
                                imgFileObj.width = imgInfoRes.width;
                                imgFileObj.height = imgInfoRes.height;
                                imgFileObj.path = imgInfoRes.path;
                                _parseSize();
                            }
                        })
                    }
                }
            })
        }
    }

    // /**
    //  * 添加小物件
    //  */
    s.addItem = function(imgPath, opts){
      var img = new VC.Image();

      img.source = imgPath;
      img.width = opts.width * scale;
      img.height = opts.height * scale;
      img.x = opts.x * scale || 0;
      img.y = opts.y * scale || 0;
      img.rotation = opts.rotation || 0;
      img.scaleX = opts.scale || 1;
      img.scaleY = opts.scale || 1;
      img.anchorX = img.width / 2;
      img.anchorY = img.height / 2;

      stage.addChild(img);
      stage.update();
    }

    /**
     * 返回图片本地临时地址
     * @param  {String}       fileType      图片类型 jpg / png 默认jpg
     * @param  {Number}       qualit        图片品质 0 - 1 默认1
     * @param  {Function}     cb            回调函数
     * 
     * @return {String}                     null表示失败了，否则返回当前图片在本机的临时路径
     */
    s.getImage = function (fileType, quality, cb) {
        let w = opts.width;
        let h = opts.height;
        fileType = fileType || "jpg";
        quality = quality || 1;
        cb = cb || function(){};
        wx.showLoading({
            title: '图片生成中...',
        })
        wx.canvasToTempFilePath({
            x: 0,
            y: 0,
            width: w,
            height: h,
            destWidth: w,
            destHeight: h,
            fileType: fileType,
            quality: quality,
            canvasId: id,
            success: (res) => {
                cb(res.tempFilePath);
                wx.hideLoading();
            },
            fail: () => {
                cb(null);
                wx.hideLoading();
            }
        })
    }

    /**
     * 重置图片的位置
     */
    s.reset = function(){
        _reset();
        return s;
    }
    /**
     * 清除图片
     */
    s.clear = function(){
        _clear();
        return s;
    }
    /**
     * 销毁
     */
    s.destroy = function(){
        stage.kill();
        stage = ctx = page = opts = bgLayer = null;
        touch.destroy();
        touch = null;
    }

    //初始化==============================
    _init();


    return s;
}

module.exports = Camera;