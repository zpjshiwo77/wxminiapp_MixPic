var TouchEvent = function () {
    let s = this;

    //========= 初始化 =========
    let preV = { x: null, y: null };                //上一次的 x y 坐标
    let preTapPosition = { x: null, y: null }       //上一个tap坐标
    let pinchStartLen = null;                       //pinch开始长度
    let scale = 1;                                  //默认缩放
    let isDoubleTap = false;                        //是否双击
    let now;                                        //当前时间
    let last;                                       //交互的上一次时间
    let delta;                                      //两次交互时间差
    let tapTimeout = null,
        singleTapTimeout = null,
        longTapTimeout = null,
        swipeTimeout = null;

    //坐标
    let x1, y1, x2, y2;

    //下面是一些bind的事件
    let onRotate;                                   //旋转
    let onTouchStart;                               //触摸
    let onMultipointStart;                          //双指触摸开始
    let onMultipointEnd;                            //双指触摸结束
    let onPinch;                                    //缩放
    let onSwipe;                                    //上下左右swipe
    let onTap;                                      //
    let onDoubleTap;                                //双击
    let onLongTap;                                  //长按
    let onSingleTap;
    let onPressMove;
    let onTouchMove;
    let onTouchEnd;
    let onTouchCancel;

    //一个空的回调方法 防止回调不存在报错的问题
    function noop() {

    }
    //长度
    function getLen(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }
    //点
    function dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }
    //角度
    function getAngle(v1, v2) {
        let mr = getLen(v1) * getLen(v2);
        if (mr === 0) return 0;
        let r = dot(v1, v2) / mr;
        if (r > 1) r = 1;
        return Math.acos(r);
    }
    //交叉
    function cross(v1, v2) {
        return v1.x * v2.y - v2.x * v1.y;
    }
    //旋转角度
    function getRotateAngle(v1, v2) {
        let angle = getAngle(v1, v2);
        if (cross(v1, v2) > 0) {
            angle *= -1;
        }
        return angle * 180 / Math.PI;
    }


    function _cancelLongTap() {
        clearTimeout(longTapTimeout);
    }
    function _cancelSingleTap() {
        clearTimeout(singleTapTimeout);
    }
    //计算方向
    function _swipeDirection(x1, x2, y1, y2) {
        return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
    }

    //========= 对外方法 =========
    s.init = function (page) {
        page.touchStart = s.start;
        page.touchMove = s.move;
        page.touchEnd = s.end;
        page.touchCancel = s.cancel;
    }
    s.bind = function (options) {
        onRotate = options.onRotate || noop;
        onTouchStart = options.onTouchStart || noop;
        onMultipointStart = options.onMultipointStart || noop;
        onMultipointEnd = options.onMultipointEnd || noop;
        onPinch = options.onPinch || noop;
        onSwipe = options.onSwipe || noop;
        onTap = options.onTap || noop;
        onDoubleTap = options.onDoubleTap || noop;
        onLongTap = options.onLongTap || noop;
        onSingleTap = options.onSingleTap || noop;
        onPressMove = options.onPressMove || noop;
        onTouchMove = options.onTouchMove || noop;
        onTouchEnd = options.onTouchEnd || noop;
        onTouchCancel = options.onTouchCancel || noop;

        //每次bind的时候还原初始数据
        delta = null;
        last = null;
        now = null;
        tapTimeout = null;
        singleTapTimeout = null;
        longTapTimeout = null;
        swipeTimeout = null;
        x1 = x2 = y1 = y2 = null;
        preTapPosition = { x: null, y: null };
    }

    s.start = function (evt) {
        if (!evt.touches) return;
        now = Date.now();
        x1 = evt.touches[0].pageX == null ? evt.touches[0].x : evt.touches[0].pageX;
        y1 = evt.touches[0].pageY == null ? evt.touches[0].y : evt.touches[0].pageY;
        delta = now - (last || now);
        //touchstart
        onTouchStart(evt);
        if (preTapPosition.x !== null) {
            isDoubleTap = (delta > 0 && delta <= 250 && Math.abs(preTapPosition.x - x1) < 30 && Math.abs(preTapPosition.y - y1) < 30);
        }
        preTapPosition.x = x1;
        preTapPosition.y = y1;
        last = now;
        let len = evt.touches.length;
        if (len > 1) {
            _cancelLongTap();
            _cancelSingleTap();
            let otx = evt.touches[1].pageX == null ? evt.touches[1].x : evt.touches[1].pageX;
            let oty = evt.touches[1].pageY == null ? evt.touches[1].y : evt.touches[1].pageY;
            let v = { x: otx - x1, y: oty - y1 };
            preV.x = v.x;
            preV.y = v.y;
            pinchStartLen = getLen(preV);
            onMultipointStart(evt);
        }
        longTapTimeout = setTimeout(() => {
            evt.type = "longTap";
            onLongTap(evt);
        }, 750);

    }
    s.move = function (evt) {
        if (!evt.touches) return;
        let len = evt.touches.length,
            currentX = evt.touches[0].pageX == null ? evt.touches[0].x : evt.touches[0].pageX,
            currentY = evt.touches[0].pageY == null ? evt.touches[0].y : evt.touches[0].pageY;
            isDoubleTap = false;
        if (len > 1) {
            let otx = evt.touches[1].pageX == null ? evt.touches[1].x : evt.touches[1].pageX;
            let oty = evt.touches[1].pageY == null ? evt.touches[1].y : evt.touches[1].pageY;
            let v = { x: otx - currentX, y: oty - currentY };

            if (preV.x !== null) {
                if (pinchStartLen > 0) {
                    let pinchNewLen = getLen(v);
                    let newScale = getLen(v) / pinchStartLen;
                    evt.scale = newScale - scale;
                    scale = newScale;
                    // evt.scale = getLen(v) / pinchStartLen;
                    // evt.scale = 0.025 * (pinchNewLen - pinchStartLen) / Math.abs(pinchNewLen - pinchStartLen);
                    evt.type = "pinch";
                    //onPinch
                    onPinch(evt);
                }
                evt.angle = getRotateAngle(v, preV);
                evt.type = "rotate";
                //onRotate
                onRotate(evt);
            }
            preV.x = v.x;
            preV.y = v.y;
        } else {
            if (x2 !== null) {
                evt.deltaX = currentX - x2;
                evt.deltaY = currentY - y2;
            } else {
                evt.deltaX = 0;
                evt.deltaY = 0;
            }
            onPressMove(evt);
        }
        onTouchMove(evt);

        _cancelLongTap();
        x2 = currentX;
        y2 = currentY;
        if (len > 1) {
            // evt.preventDefault();
        }
    }
    s.end = function (evt) {
        if (!evt.changedTouches) return;
        _cancelLongTap();
        if (evt.touches.length < 2) {
            onMultipointEnd(evt);
        }
        onTouchEnd(evt);
        //swipe
        if ((x2 && Math.abs(x1 - x2) > 30) ||
            (y2 && Math.abs(y1 - y2) > 30)) {
            evt.direction = _swipeDirection(x1, x2, y1, y2);
            swipeTimeout = setTimeout(function () {
                evt.type = "swipe";
                onSwipe(evt);
            }, 0)
        } else {
            tapTimeout = setTimeout(function () {
                evt.type = "tap";
                onTap(evt);
                // doubleTap
                if (isDoubleTap) {
                    evt.type = "doubleTap";
                    onDoubleTap(evt);
                    clearTimeout(singleTapTimeout);
                    isDoubleTap = false;
                }
            }, 0)

            if (!isDoubleTap) {
                singleTapTimeout = setTimeout(function () {
                    onSingleTap(evt);
                }, 250);
            }
        }

        preV.x = 0;
        preV.y = 0;
        scale = 1;
        pinchStartLen = null;
        x1 = x2 = y1 = y2 = null;
    }
    s.cancel = function (evt) {
        clearTimeout(singleTapTimeout);
        clearTimeout(tapTimeout);
        clearTimeout(longTapTimeout);
        clearTimeout(swipeTimeout);
        onTouchCancel(evt);
    }

    s.destroy = function(){
        if (singleTapTimeout) clearTimeout(singleTapTimeout);
        if (tapTimeout) clearTimeout(tapTimeout);
        if (longTapTimeout) clearTimeout(longTapTimeout);
        if (swipeTimeout) clearTimeout(swipeTimeout);

        onRotate = null;
        onTouchStart = null;
        onMultipointStart = null;
        onMultipointEnd = null;
        onPinch = null;
        onSwipe = null;
        onTap = null;
        onDoubleTap = null;
        onLongTap = null;
        onSingleTap = null;
        onPressMove = null;
        onTouchMove = null;
        onTouchEnd = null;
        onTouchCancel = null;

        preV = pinchStartLen = scale = isDoubleTap = delta = last = now = tapTimeout = singleTapTimeout = longTapTimeout = swipeTimeout = x1 = x2 = y1 = y2 = preTapPosition = null;
    }

    return s;
}


module.exports = TouchEvent;