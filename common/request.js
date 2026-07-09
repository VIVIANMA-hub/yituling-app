/**
 * 一图灵 - 统一请求封装
 *
 * 功能：
 * - 自动携带 token（从 storage 读取）
 * - 统一 baseURL（切换环境只需改一处）
 * - 401 自动跳转登录
 * - 网络错误统一提示
 * - 请求/响应日志（仅开发环境）
 */

// ========== 配置区 ==========
const config = {
	// 开发/生产环境切换
	baseURL: 'https://api.yituling.com',
	// 请求超时（毫秒）
	timeout: 15000,
	// token 在 storage 中的 key
	tokenKey: 'auth_token',
	// 是否打印日志
	debug: process.env.NODE_ENV !== 'production'
};

/**
 * 获取本地 token
 */
function getToken() {
	try {
		return uni.getStorageSync(config.tokenKey) || '';
	} catch (e) {
		return '';
	}
}

/**
 * 清除 token 并跳转登录
 */
function forceLogout() {
	try {
		uni.removeStorageSync(config.tokenKey);
	} catch (e) {}
	// 避免重复跳转
	const pages = getCurrentPages();
	if (pages.length > 0 && pages[pages.length - 1].route !== 'pages/account/login') {
		uni.reLaunch({ url: '/pages/account/login' });
	}
}

/**
 * 显示错误提示
 */
function showError(msg) {
	uni.showToast({
		title: msg || '网络异常，请稍后重试',
		icon: 'none',
		duration: 2500
	});
}

/**
 * 核心请求方法
 *
 * @param {Object} options
 * @param {String} options.url - 接口路径（不含 baseURL）
 * @param {String} options.method - GET/POST/PUT/DELETE
 * @param {Object} options.data - 请求参数
 * @param {Object} options.header - 额外请求头
 * @param {Boolean} options.silent - 静默模式（不显示错误提示）
 * @param {Boolean} options.auth - 是否需要鉴权（默认 true）
 * @returns {Promise<any>}
 */
function request(options = {}) {
	const {
		url = '',
		method = 'GET',
		data = {},
		header = {},
		silent = false,
		auth = true
	} = options;

	// 拼接完整 URL
	const fullURL = url.startsWith('http') ? url : (config.baseURL + url);

	// 构建请求头
	const headers = {
		'Content-Type': 'application/json',
		'X-App-Version': '1.0.0',
		...header
	};

	// 自动携带 token
	if (auth) {
		const token = getToken();
		if (token) {
			headers['Authorization'] = 'Bearer ' + token;
		}
	}

	if (config.debug) {
		console.log(`[Request] ${method} ${fullURL}`, data);
	}

	return new Promise((resolve, reject) => {
		uni.request({
			url: fullURL,
			method,
			data,
			header: headers,
			timeout: config.timeout,
			success(res) {
				if (config.debug) {
					console.log(`[Response] ${fullURL}`, res.statusCode, res.data);
				}

				const statusCode = res.statusCode;

				// HTTP 状态码处理
				if (statusCode === 200 || statusCode === 201) {
					// 业务状态码处理（假设后端返回 { code: 0, data: ..., msg: '' }）
					const body = res.data;
					if (body.code !== undefined) {
						if (body.code === 0 || body.code === 200) {
							resolve(body.data !== undefined ? body.data : body);
						} else if (body.code === 401) {
							// token 失效
							if (!silent) showError('登录已过期，请重新登录');
							forceLogout();
							reject(new Error('未授权'));
						} else {
							// 业务错误
							if (!silent) showError(body.msg || '请求失败');
							reject(new Error(body.msg || 'Business Error'));
						}
					} else {
						// 没有业务 code 字段，直接返回
						resolve(body);
					}
				} else if (statusCode === 401) {
					if (!silent) showError('登录已过期，请重新登录');
					forceLogout();
					reject(new Error('未授权'));
				} else if (statusCode === 403) {
					if (!silent) showError('暂无权限访问');
					reject(new Error('禁止访问'));
				} else if (statusCode === 404) {
					if (!silent) showError('请求的资源不存在');
					reject(new Error('Not Found'));
				} else if (statusCode >= 500) {
					if (!silent) showError('服务器开小差了，请稍后再试');
					reject(new Error('Server Error'));
				} else {
					reject(new Error('HTTP ' + statusCode));
				}
			},
			fail(err) {
				if (config.debug) {
					console.error(`[Request Error] ${fullURL}`, err);
				}
				if (!silent) {
					if (err.errMsg && err.errMsg.includes('timeout')) {
						showError('请求超时，请检查网络');
					} else {
						showError('网络连接失败，请检查网络设置');
					}
				}
				reject(err);
			}
		});
	});
}

// ========== 便捷方法 ==========

/** GET 请求 */
export function get(url, data = {}, options = {}) {
	return request({ url, method: 'GET', data, ...options });
}

/** POST 请求 */
export function post(url, data = {}, options = {}) {
	return request({ url, method: 'POST', data, ...options });
}

/** PUT 请求 */
export function put(url, data = {}, options = {}) {
	return request({ url, method: 'PUT', data, ...options });
}

/** DELETE 请求 */
export function del(url, data = {}, options = {}) {
	return request({ url, method: 'DELETE', data, ...options });
}

/** 上传文件 */
export function upload(url, filePath, formData = {}, options = {}) {
	const fullURL = url.startsWith('http') ? url : (config.baseURL + url);
	const token = getToken();

	return new Promise((resolve, reject) => {
		uni.uploadFile({
			url: fullURL,
			filePath,
			name: 'file',
			formData,
			header: {
				'Authorization': token ? ('Bearer ' + token) : ''
			},
			success(res) {
				if (res.statusCode === 200) {
					try {
						const body = JSON.parse(res.data);
						if (body.code === 0 || body.code === 200) {
							resolve(body.data !== undefined ? body.data : body);
						} else {
							showError(body.msg || '上传失败');
							reject(new Error(body.msg));
						}
					} catch (e) {
						reject(e);
					}
				} else {
					showError('上传失败');
					reject(new Error('Upload failed'));
				}
			},
			fail(err) {
				showError('上传失败，请检查网络');
				reject(err);
			}
		});
	});
}

// ========== Token 管理 ==========

/** 保存 token */
export function setToken(token) {
	try {
		uni.setStorageSync(config.tokenKey, token);
	} catch (e) {}
}

/** 清除 token */
export function removeToken() {
	try {
		uni.removeStorageSync(config.tokenKey);
	} catch (e) {}
}

/** 获取 token */
export function getTokenValue() {
	return getToken();
}

// ========== 导出 ==========
export default {
	request,
	get,
	post,
	put,
	del,
	upload,
	setToken,
	removeToken,
	getToken: getTokenValue,
	config
};
