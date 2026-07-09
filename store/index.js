// #ifndef VUE3
import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
const store = new Vuex.Store({
// #endif

// #ifdef VUE3
import { createStore } from 'vuex'
const store = createStore({
// #endif
	state: {
		hasLogin: false,
		isUniverifyLogin: false,
		loginProvider: "",
		openid: null,
		testvuex: false,
		colorIndex: 0,
		colorList: ['#FF0000', '#00FF00', '#0000FF'],
		noMatchLeftWindow: true,
		active: 'componentPage',
		leftWinActive: '/pages/component/view/view',
		activeOpen: '',
		menu: [],
		univerifyErrorMsg: '',
		// vuex测试例使用
		username: "foo",
		sex: "男",
		age: 10,
		// 用户信息（统一管理，消除硬编码）
		userInfo: {
			nickName: '兔灵用户',
			realName: '医生',
			phone: '',
			avatar: '/static/rabbit.jpg',
			role: 'creator',
			teamId: '兔灵1号'
		}
	},
	mutations: {
		login(state, provider) {
			state.hasLogin = true;
			state.loginProvider = provider;
		},
		logout(state) {
			state.hasLogin = false
			state.openid = null
		},
		// 设置用户信息
		setUserInfo(state, info) {
			Object.assign(state.userInfo, info)
		},
		// 重置用户信息为默认
		resetUserInfo(state) {
			state.userInfo = {
				nickName: '兔灵用户',
				realName: '医生',
				phone: '',
				avatar: '/static/rabbit.jpg',
				role: 'creator',
				teamId: '兔灵1号'
			}
		},
		setOpenid(state, openid) {
			state.openid = openid
		},
		setTestTrue(state) {
			state.testvuex = true
		},
		setTestFalse(state) {
			state.testvuex = false
		},
		setColorIndex(state, index) {
			state.colorIndex = index
		},
		setMatchLeftWindow(state, matchLeftWindow) {
			state.noMatchLeftWindow = !matchLeftWindow
		},
		setActive(state, tabPage) {
			state.active = tabPage
		},
		setLeftWinActive(state, leftWinActive) {
			state.leftWinActive = leftWinActive
		},
		setActiveOpen(state, activeOpen) {
			state.activeOpen = activeOpen
		},
		setMenu(state, menu) {
			state.menu = menu
		},
		setUniverifyLogin(state, payload) {
			typeof payload !== 'boolean' ? payload = !!payload : '';
			state.isUniverifyLogin = payload;
		},
		setUniverifyErrorMsg(state,payload = ''){
			state.univerifyErrorMsg = payload
		},
		// vuex测试例使用
		increment(state) {
		  state.age++;
		},
		incrementTen(state, payload) {
		  state.age += payload.amount
		},
		resetAge(state){
		  state.age = 10
		}
	},
	getters: {
		currentColor(state) {
			return state.colorList[state.colorIndex]
		},
		// vuex测试例使用
		doubleAge(state) {
		  return state.age * 2;
		},
		// 当前用户真实姓名（统一入口）
		realName(state) {
			return state.userInfo.realName
		},
		// 当前用户头像
		avatar(state) {
			return state.userInfo.avatar
		},
		// 是否已完整登录
		isLoggedIn(state) {
			return state.hasLogin && !!state.userInfo.phone
		}
	},
	actions: {
		// vuex测试例使用
		incrementAsync(context , payload) {
		  context.commit('incrementTen',payload)
		},
		// lazy loading openid
		getUserOpenId: async function({
			commit,
			state
		}) {
			return await new Promise((resolve, reject) => {
				if (state.openid) {
					resolve(state.openid)
				} else {
					uni.login({
						success: (data) => {
							commit('login')
							setTimeout(function() { //模拟异步请求服务器获取 openid
								const openid = '123456789'
								console.log('uni.request mock openid[' + openid + ']');
								commit('setOpenid', openid)
								resolve(openid)
							}, 1000)
						},
						fail: (err) => {
							console.log('uni.login 接口调用失败，将无法正常使用开放接口等服务', err)
							reject(err)
						}
					})
				}
			})
		},
		getPhoneNumber: function({
			commit
		}, univerifyInfo) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://97fca9f2-41f6-449f-a35e-3f135d4c3875.bspapp.com/http/univerify-login',
					method: 'POST',
					data: univerifyInfo,
				success: (res) => {
					const data = res.data
					if (data.success) {
						resolve(data.phoneNumber)
					} else {
						reject(res)
					}

				},
				fail: (err) => {
					reject(err) // 修复：原来是 reject(res) 导致 ReferenceError，res 在此作用域未定义
				}
				})
			})
		}
	}
})

export default store
