
function InitWx()
{
	var u = window.Util;
	if(!u) return;

	var wx = window.wx;
	if(!wx) return;
	wx.config(JsapiConfig);

	wx.error(function(res) {
		//alert('WX JSSDK初始化失败', res);
	});

	wx.ready(function() {
		//	alert('ready');
		u.whenWxReady();
	});
}


function InitWxShare() 
{
	var u = window.Util;
	if(!u) return;

	u.wxSetDataForShare(
		document.title || '菩提果',
		document.title || '菩提果',
		window.location.href || 'http://www.putibaby.com/',
		'http://h5.putibaby.com/assets/i/logo.jpg'
	);
}

function SetBodyCss(x) {
	$('body').css(x);
}

var PTBBAPI = new (function(w) {

	this.isCallFromiOS = function() {
		if(w && w.webkit && w.webkit.messageHandlers && w.webkit.messageHandlers.ptbb) {
			return true;
		}
		return false;
	};

	/**
	 * 向iOS端发送消息
	 * @param {String} msg 消息名
	 * @param {Array} params 参数列表
	 */
	var _postMsgToiOS = function(msg, params) {
		if (!params) {
			params = [];
		}
		try {
			// 发送消息到iOS端注入的MessageHandler: ptbb
			w.webkit.messageHandlers.ptbb.postMessage({'method': msg, 'params': params});
		} catch(err) {
			// 找不到注入的ptbb
			console.log('ptbb.postMessage ' + message.method + ' failed: ');
		}
	};

	var hDict = {};

	w.ptbbEmitEvent = function(name, args) {
		if(!name) return;
		var calls = hDict[name];
		calls.forEach(function(c) {
			c(args);
		});
	};

	this.addEventListener = function(name, call) {
		if(!call) return;

		if(!(name in hDict)) {
			hDict[name] = [];
		}
		hDict[name].push(call);
	},

	this.removeEventListener = function(name, call) {
		if(!call) return;

		var list = hDict[name];
		if(!list) return;
		var newList = [];
		for (var i = 0;i < list.length;i++) {
			if(list[i] == call) continue;
			newList.push(list[i]);
		}
		if (newList.length > 0) {
			hDict[name] = newList;
		} else {
			delete hDict[name];
		}
	},

	this.uploadImageForPage = function(fn,eventName) {
		if (w.ptbb && w.ptbb.uploadImageForPage) {
			w.ptbb.uploadImageForPage(fn,eventName);
		} else if (this.isCallFromiOS()) {
			_postMsgToiOS('uploadImageForPage', [fn, eventName]);
		} else {
			// alert('PTBBAPI.uploadImageForPage failed', fn, eventName);
			console.log('PTBBAPI.uploadImageForPage failed', fn, eventName);
		}
	}

	this.isInApp = function() {
		if (this.isCallFromiOS()) {
			return true;
		}
		return !!w.ptbb;
	};
	this.isInMama = function() {
		return (!!w.ptbb && !!w.ptbb.getAppType && w.ptbb.getAppType() == 'mama' ||
			navigator.userAgent.match(/ptgAppType\/mama/) == 'ptgAppType/mama');
	};
	this.getAppVersion = function() {
		if(w.ptbb && w.ptbb.getAppVersion) {
			return w.ptbb.getAppVersion();
		} else {
			console.log('PTBBAPI.getAppVersion failed');
		}
	};
	this.isJinguo = function() {

		var is_jg = false;
		var str = this.getAppVersion();
		if (str) {
			var strs = str.split('.');
			if (strs[0]>6 ||(strs[0]==6 && strs[1]>=6)) {
				is_jg = true;
			}
		} else if (this.isCallFromiOS() && w.webkit.messageHandlers.ptbbSupportJinguo) {
			// 若存在 ptbbSupportJinguo 则表明版本支持金果跳转支付的功能
			return true;
		}

		console.log(str,strs);
		console.log(!!w.ptbb && !!this.getAppVersion && is_jg);
		return (!!w.ptbb && !!this.getAppVersion && is_jg);
	};
	this.showAlert = function(text, n) {
		if(!n) n = 1000;
		if(w.ptbb && w.ptbb.showAlert) {
			w.ptbb.showAlert(text, n);
		} else if (this.isCallFromiOS()) {
			_postMsgToiOS('showAlert', [text, n]);
		} else {
			console.log('PTBBAPI.showAlert failed', text, n);
		}
	};
	this.showImageSet = function(urls, idx) {
		if(!urls || !urls.length) return;
		if(!idx) idx = 0;

		// in app?
		if(w.ptbb && w.ptbb.showImageSet) {
			w.ptbb.showImageSet(urls, idx);
			return true;
		} else if (this.isCallFromiOS()) {
			_postMsgToiOS('showImageSet', [urls, idx]);
			return true;
		}

		var ua = navigator.userAgent;
		if(/MicroMessenger/i.test(ua) && wx && wx.previewImage) {
			// 微信，可以使用微信 JSSDK 来打开图片进行预览
			wx.previewImage({
				current: urls[idx], 
				urls: urls
			});
			return true;
		}

		console.log('PTBBAPI.showImageSet failed', urls, idx);
		return false;
	};

	this.openWindow = function(url, key) {
		if (!url) return;
		if (!key) key = '';
		// in app?
		if (this.isInMama()) {
			self.location.href = url;
			return;
		}
		if (w.ptbb && w.ptbb.openWindow) {
			w.ptbb.openWindow(url, key);
			return true;
		} else if (this.isCallFromiOS()) {
			_postMsgToiOS('openWindow', [url, key]);
			return true;
		}

		self.location.href = url;
	};

	this.setExtraInfo = function(key, val) {
		if(w.ptbb && w.ptbb.setExtraInfo) {
			w.ptbb.setExtraInfo(key, val);
		} else if (this.isCallFromiOS()) {
			_postMsgToiOS('setExtraInfo', [key, val]);
		} else {
			console.log('PTBBAPI.setExtraInfo failed', key, val);
		}
	}


	// 育儿端v5.9开始提供
	this.openNative = function(key, data) {
		if(w.ptbb && w.ptbb.openNative) {
			w.ptbb.openNative(key, data);
		} else if (this.isCallFromiOS()) {
			_postMsgToiOS('openNative', [key, data]);
		} else {
			console.log('PTBBAPI.openNative failed:', key, data);
		}
	}

	// 育儿端未实现？
	this.callNumber = function(phoneNumber) {
		if(w.ptbb && w.ptbb.callNumber) {
			w.ptbb.callNumber(phoneNumber);
		} else if (this.isCallFromiOS()) {
			_postMsgToiOS('callNumber', [phoneNumber]);
		} else {
			console.log('PTBBAPI.callNumber failed:', phoneNumber);
		}
	}

	// 育儿端未实现？
	this.showJyJfAlert = function(desc, jy, jf) {
		desc = desc || '';
		jy = +jy;
		jf = +jf;
		if(w.ptbb && w.ptbb.showJyJfAlert) {
			w.ptbb.showJyJfAlert(desc, jy, jf);
		} else if (this.isCallFromiOS()) {
			_postMsgToiOS('showJyJfAlert', [desc, jy, jf]);
		} else {
			console.log('PTBBAPI.showJyJfAlert failed:', desc, jy, jf);
		}
	}

	// 育儿端未实现？
	this.playVoice = function(url) {
		if(w.ptbb && w.ptbb.playVoice) {
			w.ptbb.playVoice(url);
		} else if (this.isCallFromiOS()) {
			_postMsgToiOS('playVoice', [url]);
		} else {
			console.log('PTBBAPI.playVoice failed:', url);
		}
	}

	// 育儿端未实现？
	this.doLogin = function() {
		if(w.ptbb && w.ptbb.doLogin) {
			w.ptbb.doLogin();
		} else if (this.isCallFromiOS()) {
			_postMsgToiOS('doLogin');
		} else {
			console.log('PTBBAPI.doLogin failed');
		}
	}

})(window);

var API = {};


API.wrapRet_ = function(api, opts, cb) {
	$.post(api, opts)
	.done(function(ret) {
		if(ret.success) cb(true, ret.data);
		else cb(false, ret.error);
	})
	.fail(function(err) {
		cb(false, err);
	});
}


API.sendPhoneNumberVerifySms = function(phoneNumber, cb) {
	if(!/^1\d{10}$/.test(phoneNumber)) {
		cb(false, '错误的手机号');
		return;
	}

	API.wrapRet_(
		'/api/send_sms', {
			'phone_number': phoneNumber
		}, 
		cb);
}



API.sendPhoneNumberVerifySmsWithGt = function(phoneNumber, cb) {
	if(!/^1\d{10}$/.test(phoneNumber)) {
		cb(false, '错误的手机号');
		return;
	}

	var handler = function (captchaObj) {
		// captchaObj.appendTo('#captcha');
		captchaObj.onReady(function () {
			$("#wait").hide();
			captchaObj.verify();
		}).onSuccess(function () {
			var result = captchaObj.getValidate();
			if (!result) {
				return alert('请完成验证');
			}
			// window.gt_loading = false;
			API.wrapRet_(
				'/api/send_sms_validate', {
					'phone_number': phoneNumber,
					'geetest_challenge': result.geetest_challenge,
					'geetest_validate': result.geetest_validate,
					'geetest_seccode': result.geetest_seccode
				}, 
				cb);

		});

		window.captchaObj = captchaObj;

	};


	$.ajax({
		url: "/api/gt_register?t=" + (new Date()).getTime(), // 加随机数防止缓存
		type: "get",
		dataType: "json",
		success: function (ret) {
			console.log(ret);
			var data = ret.data;

			// 调用 initGeetest 进行初始化
			// 参数1：配置参数
			// 参数2：回调，回调的第一个参数验证码对象，之后可以使用它调用相应的接口
			initGeetest({
				// 以下 4 个配置参数为必须，不能缺少
				gt: data.gt,
				challenge: data.challenge,
				offline: !data.success, // 表示用户后台检测极验服务器是否宕机
				new_captcha: data.new_captcha, // 用于宕机时表示是新验证码的宕机

				product: "bind", // 产品形式，包括：float，popup
				width: "300px"
				// 更多配置参数说明请参见：http://docs.geetest.com/install/client/web-front/
			}, handler);

		}
	});
}

API.verifyPhoneNumber = function(phoneNumber, sms, cb) {
	if(!/^1\d{10}$/.test(phoneNumber)) {
		cb(false, '错误的手机号');
		return;
	}

	if(!/^\d{4,6}$/.test(sms)) {
		cb(false, '错误的验证码');
		return;
	}

	API.wrapRet_(
		'/api/verify_sms', 
		{
			'phone_number': phoneNumber,
			'sms': sms
		}, cb);
}

API.verifyPhoneNumberWithFrom = function(phoneNumber, sms, from, cb) {
	if(!/^1\d{10}$/.test(phoneNumber)) {
		cb(false, '错误的手机号');
		return;
	}

	if(!/^\d{4,6}$/.test(sms)) {
		cb(false, '错误的验证码');
		return;
	}

	API.wrapRet_(
		'/api/verify_sms', 
		{
			'phone_number': phoneNumber,
			'sms': sms,
			'tyd':from.tyd || 0,
			'wxfrom':from.wxfrom || '',
		}, cb);
}

API.saveSkills = function(ids, cb) {
	API.wrapRet_(
		'/api/save_skills', 
		{
			'ids': ids
		}, cb);
}

API.saveQs = function(qs, cb) {
	API.wrapRet_(
		'/api/save_qs', 
		{
			'qs': qs.join('\n')
		}, cb);
}

API.applyRec = function(cb) {
	API.wrapRet_(
		'/api/apply_rec', {}, cb);
}

/*

API.selectMaster = function(ycq, 
		price_from_req, price_to_req, 
		work_year_from_req, work_year_to_req,
		age_from_req, age_to_req, 
		location_req, jiguan_req, p, cb) {
	API.wrapRet_(
		'/api/select_master', 
		{
			'ycq': ycq, // 2014-01-02
			'price_from': price_from_req,
			'price_to': price_to_req,
			'work_year_from': work_year_from_req,
			'work_year_to': work_year_to_req,
			'age_from': age_from_req,
			'age_to': age_to_req,
			'location': location_req,
			'jiguan': jiguan_req,
			'p': p
		},
		cb);

	// 数据格式
	// {
	//    list: [], total: 100	
	// }
}*/


API.setMyInfo = function(ycq, priceFrom, priceTo, ageFrom, ageTo, workYearFrom, workYearTo, location, name, cb) {
	API.wrapRet_(
		'/api/set_my_info', 
		{
			'ycq': ycq,
			'price_from': priceFrom,
			'price_to': priceTo,
			'age_from': ageFrom,
			'age_to': ageTo,
			'work_year_from': workYearFrom,
			'work_year_to': workYearTo,
			'location': location,
			'name':name
		},
		cb);
}

API.setMyInfo_Dec = function(ycq, name, masterType, cb) {
	API.wrapRet_(
		'/api/set_my_info', 
		{
			'ycq': ycq,
			'masterType':masterType,
			'name':name,
			'type':'Dec',
		},
		cb);
}

API.favMaster = function(masterId, cb) {
	API.wrapRet_(
		'/api/fav_master', 
		{
			'master_id': masterId
		},
		cb);
}


API.unfavMaster = function(masterId, cb) {
	API.wrapRet_(
		'/api/unfav_master', 
		{
			'master_id': masterId
		},cb);
}

API.getMasterNumber = function(masterId, cb) {
	API.wrapRet_(
		'/api/get_master_number',
		{
			'master_id': masterId
		},
		cb);
}
API.videoInterviewMaster = function(masterId, info, cb){
	API.wrapRet_(
		'/api/video_interview_master', 
		{
			'master_id': masterId,
			'info': info
		},
		cb);
}

API.interviewMaster = function(masterId, qs, cb) {
	API.wrapRet_(
		'/api/interview_master', 
		{
			'master_id': masterId,
			'qs': qs.join('\n')
		},
		cb);
}

API.zjqd = function(masterId, master_type, cb) {
	API.wrapRet_(
		'/api/zjqd', {
			'master_id': masterId,
			'master_type':master_type
		},
		cb);
}

API.saveRealNameAndIdCard = function(realName, idCard, cb) {
	API.wrapRet_(
		'/api/save_real_name_and_id_card', {
			real_name: realName,
			id_card: idCard
		},
		cb);
}

function goto(idx) {
	if(typeof(idx) == 'number') {
		window.history.go(idx);
	} else {
		window.location.href = idx;
	}
}

