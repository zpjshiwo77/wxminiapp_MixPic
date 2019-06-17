const imath = function() {
    let math = {};

	math.randomRange = function(min, max) { //获得范围内随机整数
		let randomNumber;
		randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
		return randomNumber;
	}

	math.randomSort = function(ary) { //随机打乱一个数组
		if(ary && ary.length > 1) ary.sort(function() {
			return 0.5 - Math.random();
		});
	}

	math.randomPlus = function() { //随机打乱一个数组
		return Math.random() < 0.5 ? -1 : 1;
	}

	math.autoSize = function(aryNum, aryMax, cover = 0) { //等比缩放,分cover模式和contain模式
		let aryNow = new Array()
		let aryRate = aryNum[0] / aryNum[1];
		aryNow[0] = aryMax[0];
		aryNow[1] = Math.round(aryNow[0] / aryRate);
		if(cover) {
			if(aryNow[1] < aryMax[1]) {
				aryNow[1] = aryMax[1];
				aryNow[0] = Math.round(aryNow[1] * aryRate);
			} //end if
		} //end if
		else {
			if(aryNow[1] > aryMax[1]) {
				aryNow[1] = aryMax[1];
				aryNow[0] = Math.round(aryNow[1] * aryRate);
			} //end if
		} //end else
		return aryNow;
	}

	math.ease = function(_now, _tar, _speed = 10, _space = 0.1) { //缓动函数
		let _dis = _tar - _now;
		if(Math.abs(_dis) > _space) return _dis / _speed + _now;
		else return _tar;
	}

	math.toRadian = function(degree) { //角度转弧度
		return degree * Math.PI / 180;
	}

	math.toDegree = function(radian) { //弧度转角度
		return radian / Math.PI * 180;
	}

	math.arrayToInt = function(ary) { //把一个数组转成数字
		let num = 0;
		for(let i = 0; i < ary.length; i++) num += ary[i] * Math.pow(10, (ary.length - 1 - i));
		return num;
	}

	math.deepClone = function(source) { //深度复制
		let that = this;

		function getClone(_source) {
			let clone = that.dataType(_source) == "array" ? [] : {};
			for(let i in _source) {
				if(that.dataType(_source[i]) != 'object' && that.dataType(_source[i]) != 'array') clone[i] = _source[i];
				else clone[i] = getClone(_source[i]);
			} //end for
			return clone;
		} //edn func
		return getClone(source);
	}

	math.dataType = function(o) { //判断是数组还是对象
		if(typeof(o) === 'object') return Array == o.constructor ? 'array' : 'object';
		else return null;
	}

	math.objectLength = function(obj) { //获得Object的长度
		return Object.keys(obj).length;
	}

	math.formatNumber = function(value) { //将数字格式化
		value = value.toString();
		if(value.length <= 3) {
			return value;
		} else {
			return this.formatNumber(value.substr(0, value.length - 3)) + ',' + value.substr(value.length - 3);
		}
	}

	math.float = function(value, pt = 2) { //截取小数点后几位，非四舍五入
		value = value.toString();
		if(value.indexOf('.') == -1) return value;
		else {
			let str1 = value.split('.');
			let str2 = str1[0] + '.' + str1[1].substr(0, pt);
			return Number(str2);
		} //end else
	}

	math.getDis = function(pos1, pos2) { //获得2点之间的距离
		let lineX = pos2[0] - pos1[0];
		let lineY = pos2[1] - pos1[1];
		return Math.sqrt(Math.pow(Math.abs(lineX), 2) + Math.pow(Math.abs(lineY), 2));
	}

	math.getDeg = function(pos1, pos2) { //获得2点之间的夹角
		let deg;
		if(pos1[0] == pos2[0] && pos1[1] == pos2[1]) {
			deg = 0;
		} else {
			let dis_y = pos2[1] - pos1[1];
			let dis_x = pos2[0] - pos1[0];
			deg = Math.atan(dis_y / dis_x) * 180 / Math.PI;
			if(dis_x < 0) {
				deg = 180 + deg;
			} else if(dis_x >= 0 && dis_y < 0) {
				deg = 360 + deg;
			}
		} //end else
		return deg;
	}

	math.hitTest = function(source, target) { //测试2个矩形区域是否重合
		if(source && target) {
			let pos1 = [source.left + source.width * 0.5, source.top + source.height * 0.5];
            let pos2 = [target.left + target.width * 0.5, target.top + target.height * 0.5];
			let disX = Math.abs(pos2[0] - pos1[0]);
			let disY = Math.abs(pos2[1] - pos1[1]);
			let disXMin = (source.width + target.width) * 0.5;
			let disYMin = (source.height + target.height) * 0.5;
			if(disX <= disXMin && disY <= disYMin) return true;
			else return false;
		} //end if
		else return false;
	}

	math.hitPoint = function(source, target) { //测试一个点和一个区域是否重合
		if(source && target) {
            let area = [target.left, target.left + target.width, target.top, target.top + target.height];
			if(source[0] >= area[0] && source[0] <= area[1] && source[1] >= area[2] && source[1] <= area[3]) return true;
			else return false;
		} //end if
		else return false;
	}

	math.colorToRgb = function(color) { //将颜色值转换成rgb值
		if(color.match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i)) {
			let value = color.slice(color.indexOf('#') + 1),
				isShortNotation = (value.length === 3),
				r = isShortNotation ? (value.charAt(0) + value.charAt(0)) : value.substring(0, 2),
				g = isShortNotation ? (value.charAt(1) + value.charAt(1)) : value.substring(2, 4),
				b = isShortNotation ? (value.charAt(2) + value.charAt(2)) : value.substring(4, 6);
			return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)];
		} //end if
		else return [0, 0, 0];
	}

    math.formatTime = function (date) { //格式化时间
		const year = date.getFullYear()
		const month = date.getMonth() + 1
		const day = date.getDate()
		const hour = date.getHours()
		const minute = date.getMinutes()
		const second = date.getSeconds()
		return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
	}

    math.formatNumber = function (n) { //将小于10的数字前面加'0'
        n = n.toString();
		return n[1] ? n : '0' + n;
	}

    math.thousandNumber = function (n) { //给数字加上千分位
        n = n.toString();
        var re = /\d{1,3}(?=(\d{3})+$)/g;
        var n1 = n.replace(/^(\d+)((\.\d+)?)$/, function (s, s1, s2) { return s1.replace(re, "$&,") + s2; });
        return n1;
    }

	return math;
};

module.exports = imath();