var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();


//VCanvas
var VCanvas = {};
//简称
var VC = VCanvas;
//vc里面子元素的id 默认1 
VC._instanceId = 1;

//小提示 每次做旋转缩放描边等操作的时候记得先save一下 等操作结束 restore 还原回来 这样才能保证canvas回到最初始状态

/**
 * 基类
 * 任何显示对象都有 width height x y
 */
VC.Sprite = function () {
    var s = this;
    s.stage = null;             //舞台对象
    s.name = "";                //名字
    s.width = 0;                //宽度
    s.height = 0;               //高度
    s.x = 0;                    //显示对象位置x
    s.y = 0;                    //显示对象位置Y
    s.anchorX = 0;              //显示对象上x方向的缩放或旋转点
    s.anchorY = 0;              //显示对象上y方向的缩放或旋转点
    s.scaleX = 1;               //显示对象x方向的缩放值
    s.scaleY = 1;               //显示对象y方向的缩放值
    s.rotation = 0;             //显示对象旋转角度

    //更新 子类继承
    s.update = function (ctx) {

    }
    //绘制路径
    s.createPath = function (ctx){
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.closePath();  
        ctx.stroke();
    }
    return s;
}

/**
 * 文本显示对象
 */
VC.Text = function () {
    //继承
    let _super = VC.Sprite;
    __extends(VC.Image, _super);

    let s = _super.call(this) || this;

    let _lineWidth = 0;             //一行的宽度自动换行的时候用到
    let _width = 0;                 //内部文本实际宽度
    let _intX = 0;                  //内部文本实际坐标X
    let _intY = 0;                  //内部文本实际坐标Y
    let _centerOffsetX = 0;         //内部文本实际偏移X    此偏移只有在设置align为center的时候才生效
    let _centerOffsetY = 0;         //内部文本实际偏移Y
    let _lastSubStrIndex = 0;       //内部文本截取索引

    s.text = '';                    //内容
    s.align = "left";               //对齐方式
    s.color = "#000000";            //文字颜色
    s.fontSize = 30;                //字体大小
    s.stroke = 0;                   //描边大小 暂不支持
    s.strokeColor = "#000000";      //描边颜色 暂不支持
    s.wordWrap = false;             //是否换行


    function _reset() {
        _lineWidth = 0;
        _lastSubStrIndex = 0;
        _intX = s.x;
        _intY = s.y;
        if (s.width == 0) {
            //如果文本的宽度没有设置 默认等于canvas的宽度
            _width = s.stage.width;
        } else {
            _width = s.width;
        }
        //如果文本居中的话中心点其实在文本的宽度一半的位置
        if (s.align == 'center') {
            _centerOffsetX = _width / 2;
        }
        //Y轴偏移量 等于当前字体的大小
        _centerOffsetY = s.fontSize;
    }
    function _setStyle(ctx) {
        ctx.rotate(s.rotation * Math.PI / 180);
        ctx.setFillStyle(s.color);
        ctx.setTextAlign(s.align);
        ctx.setTextBaseline('middel');                  //水平对齐方式
        ctx.setFontSize(s.fontSize);
        if (s.stroke > 0) {
            // ctx.setLineWidth(5);
            // ctx.setStrokeStyle('#f3cf9d');
            // ctx.stroke()
        }
    }
    function _updateNormal(ctx) {
        ctx.fillText(s.text, _intX + _centerOffsetX, _intY + _centerOffsetY);
    }
    function _updateWrap(ctx) {
        let str = s.text;
        let len = str.length;

        for (let i = 0; i < len; i++) {
            //计算每个字的宽度 如果超出文本自身定义的宽度则换行
            // _lineWidth += ctx.measureText(str[i]).width;
            _lineWidth += s.fontSize;
            //减去文本的X,防止边界出现的问题
            // if (_lineWidth > (_width - _intX)) {
            if (_lineWidth > (_width)) {
                ctx.fillText(str.substring(_lastSubStrIndex, i), _intX + _centerOffsetX, _intY + _centerOffsetY);
                _intY += s.fontSize;
                _lineWidth = 0;
                _lastSubStrIndex = i;
            }
            if (i == (len - 1)) {
                ctx.fillText(str.substring(_lastSubStrIndex, i + 1), _intX + _centerOffsetX, _intY + _centerOffsetY);
            }
        }
    }
    function _autoLine(ctx) {
        ctx.save();
        //数据重置
        _reset();
        //样式
        _setStyle(ctx);
        if (s.wordWrap) {
            //自动换行渲染 自动换行渲染有性能问题 因为现在小程序不支持canvas缓存
            _updateWrap(ctx);
        } else {
            //默认渲染
            _updateNormal(ctx);
        }

        ctx.restore();
    }

    s.update = function (ctx) {
        if (s.text != '') {
            _autoLine(ctx);
        }

    }

    return s;
}

/**
 * Image显示对象 
*/
VC.Image = function () {
    //继承
    let _super = VC.Sprite;
    __extends(VC.Image, _super);

    let s = _super.call(this) || this;


    s.source = null;            //图片的资源路径
    s.fillType = null;          //绘制类型目前只有圆形
    s.stroke = 0;               //描边大小
    s.strokeColor = "#000000";  //描边颜色


    //普通绘制
    function _updateNormal(ctx) {
        let _x = (s.anchorX + s.x);
        let _y = (s.anchorY + s.y);
        ctx.save();
        ctx.translate(_x, _y);
        ctx.scale(s.scaleX, s.scaleY);
        ctx.rotate(s.rotation * Math.PI / 180);
        ctx.translate(-_x, -_y);
        ctx.drawImage(s.source, s.x, s.y, s.width, s.height);
        if (s.stroke > 0) {
            ctx.setLineWidth(s.stroke);
            ctx.setStrokeStyle(s.strokeColor);
            ctx.stroke()
        }
        ctx.restore();
    }
    //圆形绘制
    function _updateCircle(ctx) {
        //计算一下半径 就是图片宽度的一半
        let radius = s.width / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(s.x + radius, s.y + radius, radius, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(s.source, s.x, s.y, s.width, s.height);
        if (s.stroke > 0) {
            ctx.setLineWidth(s.stroke);
            ctx.setStrokeStyle(s.strokeColor);
            ctx.stroke()
        }
        ctx.restore();
    }

    //重写更新
    s.update = function (ctx) {
        if (s.source) {
            //计算一下中心点 默认是图片的中间
            let x = s.width * 0.5;
            let y = s.height * 0.5;
            switch (s.fillType) {
                case "circle":
                    _updateCircle(ctx);
                    break;
                default:
                    _updateNormal(ctx);
                    break;
            }
            // s.createPath(ctx);
        }
    }
}

/**
 * canvas舞台场景
 * content  小程序的canvas context
 * width    宽度
 * height   高度
 */
VC.Stage = function (context, width, height, opts) {
    var s = this;
    //所有子集集合
    var childrens = [];
    //子集字典
    var childDic = {};
    //当前有多少个元素在场景里面
    var childrenLen = 0;
    //canvas context
    var ctx = context;
    
    //canvas绘制完成事件
    opts.onDraw = opts.onDraw || function () { };
    s.width = width;
    s.height = height;

    /**
     * 添加一个显示对象
     */
    s.addChild = function (obj) {
        if(obj.name && obj.name != '' && obj.name != null && obj.name != undefined){
            childDic[obj.name] = obj;
        }
        obj.stage = s;
        childrens.push(obj);
        childrenLen++;
        return s;
    }
    /**
     * 移除一个显示对象
     */
    s.removeChild = function (child) {
        let index = childrens.indexOf(child);
        if (index != -1) {
            child.stage = null;
            childrens.splice(index, 0);
            childrenLen--;
            //找到对应的字典里面的对象 删除掉
            if (childDic[child.name]){
                childDic[child.name] = null;
                delete childDic[child.name];
            }
        }
        return s;
    }
    /**
     * 移除所有
     */
    s.removeAll = function () {
        childrens = [];
        childrenLen = 0;
        childDic = {};
        return s;
    }
    /**
     * 根据name获取对应的子元素
     */
    s.getChildByName = function(name){
        return childDic[name];
    }

    /**
     * 为了方便添加多个 额外增加的接口
     * 此方法是方便一次性添加多个元素而存在的
     * list 数组
     * { type: 'image', path: '/images/card/code_card_top.png', width: 706, height: 857, x: 22, y: 470, rotation: 0, fillType:null }
     * { type: 'text', text: '恭喜发财大吉大利', width: 750, x: 0, y: 240, rotation: 0, color: "#fecb7a", align: 'center', fontSize: 30, stroke: 5, wordWrap: false }
     */
    s.addChildByList = function (list) {
        let i = 0;
        let len = list.length;
        if (len > 0) {
            for (i = 0; i < len; i++) {
                let obj = list[i];
                let sp = null;
                switch (obj.type) {
                    case "image":
                        sp = VC._C_IMG(obj);
                        break;
                    case "text":
                        sp = VC._C_TEXT(obj);
                        break;
                }
                if (sp) {
                    s.addChild(sp);
                }
            }
        }
        return s;
    }

    //更新 （每次增加或者移除都需要手动调用一次update）
    s.update = function () {
        console.log('update --- childrenLen:' + childrenLen);
        for (var i = 0; i < childrenLen; i++) {
            var child = childrens[i];
            child.update(ctx);
            // console.log(child);
        }
        ctx.draw(false, () => {
            opts.onDraw();
        });
        return s;
    }
    //移除销毁
    s.kill = function(){
        s.removeAll();
        ctx.draw(false);
        opts = null;
        ctx = null;
    }


    return s;
}



//内部方法 创建一个image对象
VC._C_IMG = function (obj) {
    if (obj && obj.path) {
        //创建一个Image对象
        let img = new VC.Image();
        //设置图片路径
        img.source = obj.path;
        //图片的宽度
        img.width = obj.width || 0;
        //图片的高度
        img.height = obj.height || 0;
        //图片的角度
        img.rotation = obj.rotation || 0;
        //图片X位置
        img.x = obj.x || 0;
        //图片Y位置
        img.y = obj.y || 0;
        //绘制类型 目前只有默认 和圆形两种
        img.fillType = obj.fillType || '';
        //描边
        img.stroke = obj.stroke || 0;
        //描边颜色
        img.strokeColor = obj.strokeColor || '#000000';
        img.name = obj.name || 'instance_' + VC._instanceId;
        VC._instanceId++;
        return img;
    }
    return null;

}
//内部方法 创建一个text对象
VC._C_TEXT = function (obj) {
    if (obj && obj.text) {
        //创建一个Text对象
        let text = new VC.Text();
        //设置文本的内容
        text.text = obj.text;
        //角度
        text.rotation = obj.rotation || 0;
        //文本宽度如果是0 默认会等于canvas的宽度
        text.width = obj.width || 0;
        //文本颜色
        text.color = obj.color || 0;
        //文本对齐方式 
        text.align = obj.align || 'left';
        //文本字体大小
        text.fontSize = obj.fontSize || 30;
        //文本描边大小
        // text.stroke = obj.stroke || 0;
        //文本X位置
        text.x = obj.x || 0;
        //文本Y位置
        text.y = obj.y || 0;
        //是否换行
        text.wordWrap = obj.wordWrap || false;
        text.name = obj.name || 'instance_' + VC._instanceId;
        VC._instanceId++;
        return text;
    }
    return null;
}


module.exports = VC;