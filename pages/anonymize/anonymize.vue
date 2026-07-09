<template>
  <view class="page">
    <view class="status-bar"></view>

    <view class="nav">
      <view class="back-btn" @click="goBack">‹</view>
      <text class="nav-title">{{ state === 'card' ? '脱敏卡片预览' : '脱敏助手' }}</text>
      <view class="help-btn" @click="showHelp">?</view>
    </view>

    <!-- 主流程：上传、扫描、人工复核 -->
    <scroll-view v-if="state !== 'card'" scroll-y class="content" :show-scrollbar="false">
      <view class="hero">
        <text class="hero-title">保护患者隐私</text>
        <text class="hero-desc">
          上传前请确认素材来源合法。本功能仅用于辅助标记和遮挡可能包含个人信息的区域，不提供诊断、治疗、用药或分诊建议。
        </text>
      </view>

      <view class="media-card">
        <view v-if="!tempFilePath" class="upload-box" @click="beforePickMedia">
          <view class="upload-icon">＋</view>
          <text class="upload-title">点击上传图片</text>
          <text class="upload-desc">支持报告截图、胶片照片、教学截图和手绘标注图</text>
        </view>

        <view v-else class="preview-box">
          <image
            v-if="mediaType === 'image'"
            class="preview-media"
            :src="tempFilePath"
            mode="aspectFit"
          ></image>

          <view v-if="state === 'scanning'" class="grid-overlay"></view>
          <view v-if="state === 'scanning'" class="scan-line"></view>

          <block v-if="state === 'result'">
            <view
              v-for="mark in redactionMarks"
              :key="mark.id"
              class="redaction-mark"
              :class="{ disabled: !mark.enabled }"
              :style="{
                left: mark.x + '%',
                top: mark.y + '%',
                width: mark.w + '%',
                height: mark.h + '%'
              }"
              @click.stop="toggleMark(mark.id)"
            >
              <text>{{ mark.enabled ? '已遮挡' : '未遮挡' }}</text>
            </view>
          </block>

          <view v-if="state === 'result'" class="safe-badge">
            <text class="safe-icon">✓</text>
            <text class="safe-text">已完成自动检测，请人工复核</text>
          </view>
        </view>
      </view>

      <view class="progress-card" v-if="state !== 'idle'">
        <view class="progress-head">
          <text class="progress-title">隐私检测进度</text>
          <text class="progress-num">{{ scanStatus }}%</text>
        </view>

        <view class="progress-bar">
          <view class="progress-inner" :style="{ width: scanStatus + '%' }"></view>
        </view>

        <view class="check-list">
          <view class="check-item" v-for="item in checkItems" :key="item.key">
            <view class="check-left">
              <view class="check-dot" :class="item.state">
                <text v-if="item.state === 'done'">✓</text>
                <text v-else-if="item.state === 'scanning'">…</text>
              </view>
              <text class="check-name">{{ item.name }}</text>
            </view>
            <text class="check-status" :class="item.state">{{ getCheckText(item.state) }}</text>
          </view>
        </view>
      </view>

      <view class="review-card" v-if="state === 'result'">
        <view class="section-head">
          <text class="section-title">发布前人工复核</text>
          <text class="section-subtitle">请逐项确认，避免患者或医院信息外泄。</text>
        </view>

        <view class="review-list">
          <view
            class="review-item"
            v-for="item in reviewItems"
            :key="item.key"
            @click="toggleReview(item.key)"
          >
            <view class="review-check" :class="{ checked: item.checked }">
              <text v-if="item.checked">✓</text>
            </view>
            <view class="review-texts">
              <text class="review-title">{{ item.title }}</text>
              <text class="review-desc">{{ item.desc }}</text>
            </view>
          </view>
        </view>

        <view class="warning-box">
          <text class="warning-title">重要提醒</text>
          <text class="warning-text">
            生成分享卡前必须导出一张已经擦除像素的新图。页面遮罩只用于辅助定位，不能替代最终导出的脱敏图片。
          </text>
        </view>
      </view>

      <view class="review-card" v-if="state === 'result'">
        <view class="section-head">
          <text class="section-title">医生笔记</text>
          <text class="section-subtitle">只记录自己的观察与经验，不让 AI 下诊断。</text>
        </view>

        <view class="field-block">
          <text class="field-label">影像表现</text>
          <textarea class="note-input" v-model="imageDescription" maxlength="300" placeholder="例如：右下肺片状高密度影，边界欠清。仅记录用户自行观察的征象。" />
        </view>

        <view class="field-block">
          <text class="field-label">学习主题标签</text>
          <input class="note-input input-line" v-model="diseaseTag" maxlength="80" placeholder="例如：肺部、骨骼系统、腹部解剖、手部 X 线" />
        </view>

        <view class="field-block">
          <text class="field-label">学习要点</text>
          <textarea class="note-input short" v-model="practiceNote" maxlength="220" placeholder="例如：注意和肺不张鉴别；儿童骨骺不要误判骨折。本内容仅作个人学习笔记。" />
        </view>

        <view class="field-block">
          <text class="field-label">报告表达参考</text>
          <textarea class="note-input short" v-model="reportReference" maxlength="220" placeholder="整理自己的报告句式，不作为诊疗依据。" />
        </view>
      </view>

      <view class="bottom-actions">
        <view v-if="state === 'idle'" class="main-btn" @click="beforePickMedia">开始脱敏</view>

        <view v-if="state === 'scanning'" class="main-btn disabled">自动检测中 {{ scanStatus }}%</view>

        <view v-if="state === 'result'" class="btn-row">
          <view class="sub-btn" @click="exportRedactedImage">导出脱敏图</view>
          <view class="main-btn" :class="{ disabled: !canCreateCard }" @click="createCard">生成分享卡</view>
        </view>
      </view>

      <view class="safe-bottom"></view>
    </scroll-view>

    <!-- 脱敏卡片预览：安全版，没有诊断、没有 AI 专家报告 -->
    <scroll-view v-if="state === 'card'" scroll-y class="card-page" :show-scrollbar="false">
      <view class="share-card">
        <view class="card-image-wrap">
          <image
            v-if="mediaType === 'image'"
            class="card-image"
            :src="redactedFilePath"
            mode="widthFix"
          ></image>
          <view v-else class="video-placeholder">
            <text class="video-icon">▶</text>
            <text class="video-text">视频素材已完成脱敏复核</text>
          </view>
          <view class="watermark">一图灵 · 脱敏教学卡片</view>
        </view>

        <view class="card-info">
          <view class="title-row">
            <text class="card-title">脱敏案例学习卡</text>
            <text class="card-tag">学习交流</text>
          </view>

          <view class="info-row">
            <text>匿名素材</text>
            <text>已人工复核</text>
            <text>{{ todayText }}</text>
          </view>

          <view class="doc-section">
            <text class="doc-title">【影像表现】</text>
            <text class="doc-content">
              {{ imageDescription || '请填写用户自行编辑的影像表现、拍摄体位、设备参数或学习要点。本内容仅用于学习交流，不作为诊断、治疗、用药或分诊依据。' }}
            </text>
          </view>

          <view class="doc-section">
            <text class="doc-title">【学习主题标签】</text>
            <text class="doc-content strong">
              {{ diseaseTag || '由用户自行填写，仅用于个人归档和学习检索。' }}
            </text>
          </view>

          <view class="doc-section">
            <text class="doc-title">【学习要点】</text>
            <text class="doc-content strong">
              {{ practiceNote || '请填写用户自己的学习要点、避坑经验或复盘记录。' }}
            </text>
          </view>

          <view class="doc-section">
            <text class="doc-title">【报告表达参考】</text>
            <text class="doc-content">
              {{ reportReference || '可整理自己的报告表达句式。发布前仍建议由用户再次人工确认。' }}
            </text>
          </view>

          <view class="doc-section">
            <text class="doc-title">【合规声明】</text>
            <text class="doc-content">
              一图灵 1.0 是医护效率工具与经验共创社区，不提供疾病诊断、治疗建议、用药建议或医疗决策。
            </text>
          </view>
        </view>

        <view class="card-footer">
          <view class="author">
            <text class="author-avatar">医</text>
            <text class="author-name">{{ boundName }} 老师整理</text>
          </view>
          <text class="footer-note">发布前需平台审核</text>
        </view>
      </view>

      <view class="card-actions">
        <view class="sub-btn large" @click="state = 'result'">返回修改</view>
        <view class="main-btn large" @click="saveDraft">存草稿并提交审核</view>
      </view>

      <view class="safe-bottom"></view>
    </scroll-view>

    <canvas
      canvas-id="redactionCanvas"
      id="redactionCanvas"
      class="redaction-canvas"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
    ></canvas>
  </view>
</template>

<script>
export default {
  data() {
    return {
      state: 'idle',
      scanStatus: 0,
      scanTimer: null,
      tempFilePath: '',
      redactedFilePath: '',
      mediaType: 'image',
      boundName: '医生',
      exportedRedactedImage: false,
      canvasWidth: 1,
      canvasHeight: 1,
      imageDescription: '',
      diseaseTag: '',
      practiceNote: '',
      reportReference: '',
      checkItems: [
        { key: 'person', name: '患者姓名、手机号、身份证号', state: 'pending' },
        { key: 'case', name: '病案号、检查号、床号', state: 'pending' },
        { key: 'org', name: '医院名称、医生姓名、日期印记', state: 'pending' },
        { key: 'qr', name: '二维码、条码、水印、定位信息', state: 'pending' }
      ],
      redactionMarks: [],
      reviewItems: [
        {
          key: 'patient',
          title: '已复核患者身份信息',
          desc: '姓名、手机号、身份证号、住址、床号等均不可见。',
          checked: false
        },
        {
          key: 'hospital',
          title: '已复核机构与医务人员信息',
          desc: '医院名称、科室、医生签名、检查号、二维码等均不可见。',
          checked: false
        },
        {
          key: 'permission',
          title: '已确认素材来源合法',
          desc: '确认已获得必要授权，且仅用于学习交流或个人笔记。',
          checked: false
        },
        {
          key: 'notMedicalAdvice',
          title: '已知晓本功能不是诊疗工具',
          desc: '本功能不提供诊断、治疗、用药或分诊建议。',
          checked: false
        }
      ]
    }
  },

  computed: {
    canCreateCard() {
      return this.exportedRedactedImage && this.reviewItems.every(item => item.checked) && this.redactionMarks.every(item => item.enabled)
    },

    todayText() {
      const d = new Date()
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
  },

  onUnload() {
    this.clearTimer()
  },

  methods: {
    goBack() {
      if (this.state === 'card') {
        this.state = 'result'
        return
      }

      if (this.state === 'scanning') {
        uni.showToast({ title: '正在检测，请稍后', icon: 'none' })
        return
      }

      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack()
      } else {
        uni.reLaunch({ url: '/pages/index/index' })
      }
    },

    showHelp() {
      uni.showModal({
        title: '功能说明',
        content: '隐私沙盒脱敏用于辅助标记可能包含个人信息的区域。图片会通过 canvas 重新绘制并填黑遮挡区，导出的新图才允许生成分享卡；本功能不提供诊断、治疗、用药或分诊建议。',
        showCancel: false
      })
    },

    beforePickMedia() {
      uni.showModal({
        title: '上传前确认',
        content: '请确认素材来源合法，并同意本功能仅用于脱敏、个人笔记或学习交流，不用于诊断、治疗、用药或分诊。',
        confirmText: '确认上传',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) this.handlePickMedia()
        }
      })
    },

    handlePickMedia() {
      this.pickImageFallback()
    },

    pickImageFallback() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.tempFilePath = res.tempFilePaths[0]
          this.mediaType = 'image'
          this.startScan()
        },
        fail: () => {
          uni.showToast({ title: '未选择素材', icon: 'none' })
        }
      })
    },

    startScan() {
      this.clearTimer()
      this.state = 'scanning'
      this.scanStatus = 0
      this.redactionMarks = []
      this.exportedRedactedImage = false
      this.redactedFilePath = ''
      this.reviewItems.forEach(item => { item.checked = false })
      this.checkItems.forEach(item => { item.state = 'pending' })
      this.checkItems[0].state = 'scanning'

      this.scanTimer = setInterval(() => {
        this.scanStatus += 4

        if (this.scanStatus >= 28 && this.checkItems[0].state !== 'done') {
          this.checkItems[0].state = 'done'
          this.checkItems[1].state = 'scanning'
        }

        if (this.scanStatus >= 52 && this.checkItems[1].state !== 'done') {
          this.checkItems[1].state = 'done'
          this.checkItems[2].state = 'scanning'
        }

        if (this.scanStatus >= 76 && this.checkItems[2].state !== 'done') {
          this.checkItems[2].state = 'done'
          this.checkItems[3].state = 'scanning'
        }

        if (this.scanStatus >= 100) {
          this.scanStatus = 100
          this.checkItems.forEach(item => { item.state = 'done' })
          this.state = 'result'
          this.redactionMarks = this.getDefaultMarks()
          this.exportedRedactedImage = false
          this.clearTimer()
          this.safeVibrate()
        }
      }, 80)
    },

    getDefaultMarks() {
      if (this.mediaType !== 'image') {
        return [
          { id: 1, x: 8, y: 8, w: 42, h: 10, enabled: true },
          { id: 2, x: 55, y: 8, w: 32, h: 10, enabled: true }
        ]
      }

      return [
        { id: 1, x: 8, y: 8, w: 36, h: 8, enabled: true },
        { id: 2, x: 56, y: 8, w: 34, h: 8, enabled: true },
        { id: 3, x: 8, y: 84, w: 46, h: 7, enabled: true }
      ]
    },

    getCheckText(state) {
      if (state === 'done') return '已标记'
      if (state === 'scanning') return '检测中'
      return '等待中'
    },

    toggleMark(id) {
      const item = this.redactionMarks.find(mark => mark.id === id)
      if (!item) return
      item.enabled = !item.enabled
      this.exportedRedactedImage = false
      this.redactedFilePath = ''
    },

    toggleReview(key) {
      const item = this.reviewItems.find(row => row.key === key)
      if (!item) return
      item.checked = !item.checked
    },

    createCard() {
      if (!this.canCreateCard) {
        uni.showToast({ title: '请先导出脱敏图并完成复核', icon: 'none' })
        return
      }

      uni.showLoading({ title: '生成卡片中...' })
      setTimeout(() => {
        uni.hideLoading()
        this.state = 'card'
        this.safeVibrate()
      }, 600)
    },

    saveDraft() {
      const draft = {
        id: Date.now(),
        title: '脱敏案例学习卡',
        cover: this.redactedFilePath,
        mediaType: this.mediaType,
        status: 'review',
        createdAt: this.todayText,
        source: 'anonymize',
        imageDescription: this.imageDescription,
        diseaseTag: this.diseaseTag,
        practiceNote: this.practiceNote,
        reportReference: this.reportReference,
        notice: '仅供学习交流，不作为诊疗依据'
      }

      const oldList = uni.getStorageSync('ytl_case_drafts') || []
      oldList.unshift(draft)
      uni.setStorageSync('ytl_case_drafts', oldList)

      uni.showModal({
        title: '已进入审核队列',
        content: '脱敏卡片已保存到本机审核队列。通过审核前不会进入经验共创社区。',
        confirmText: '去经验库',
        cancelText: '继续编辑',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ url: '/pages/notes/notes' })
          }
        }
      })
    },

    reset() {
      this.clearTimer()
      this.state = 'idle'
      this.scanStatus = 0
      this.tempFilePath = ''
      this.redactedFilePath = ''
      this.mediaType = 'image'
      this.redactionMarks = []
      this.exportedRedactedImage = false
      this.canvasWidth = 1
      this.canvasHeight = 1
      this.imageDescription = ''
      this.diseaseTag = ''
      this.practiceNote = ''
      this.reportReference = ''
      this.checkItems.forEach(item => { item.state = 'pending' })
      this.reviewItems.forEach(item => { item.checked = false })
    },

    exportRedactedImage() {
      if (this.mediaType !== 'image') {
        uni.showModal({
          title: '暂不支持视频导出',
          content: '视频需要逐帧擦除或后端转码处理，当前版本不能保证不可还原脱敏。请先使用图片素材生成分享卡。',
          showCancel: false
        })
        return
      }

      if (!this.tempFilePath) {
        uni.showToast({ title: '请先上传图片', icon: 'none' })
        return
      }

      if (!this.redactionMarks.every(item => item.enabled)) {
        uni.showToast({ title: '请确认所有遮挡项已开启', icon: 'none' })
        return
      }

      uni.showLoading({ title: '正在导出新图...' })
      uni.getImageInfo({
        src: this.tempFilePath,
        success: (info) => {
          this.canvasWidth = Math.max(1, info.width)
          this.canvasHeight = Math.max(1, info.height)
          this.$nextTick(() => {
            this.drawRedactedImage(info)
          })
        },
        fail: () => {
          uni.hideLoading()
          uni.showToast({ title: '读取图片失败，请重试', icon: 'none' })
        }
      })
    },

    drawRedactedImage(info) {
      const ctx = uni.createCanvasContext('redactionCanvas', this)
      ctx.drawImage(info.path || this.tempFilePath, 0, 0, this.canvasWidth, this.canvasHeight)

      ctx.setFillStyle('#000000')
      this.redactionMarks
        .filter(item => item.enabled)
        .forEach(item => {
          const x = Math.max(0, item.x / 100 * this.canvasWidth)
          const y = Math.max(0, item.y / 100 * this.canvasHeight)
          const w = Math.min(this.canvasWidth - x, item.w / 100 * this.canvasWidth)
          const h = Math.min(this.canvasHeight - y, item.h / 100 * this.canvasHeight)
          ctx.fillRect(x, y, w, h)
        })

      const watermarkHeight = Math.max(34, Math.round(this.canvasHeight * 0.045))
      const padding = Math.max(12, Math.round(watermarkHeight * 0.45))
      ctx.setFillStyle('rgba(0, 0, 0, 0.72)')
      ctx.fillRect(0, this.canvasHeight - watermarkHeight - padding * 2, this.canvasWidth, watermarkHeight + padding * 2)
      ctx.setFillStyle('#ffffff')
      ctx.setFontSize(Math.max(18, Math.round(watermarkHeight * 0.48)))
      ctx.fillText('一图灵脱敏分享 · 已擦除选区像素 · 仅供学习交流', padding, this.canvasHeight - padding - Math.round(watermarkHeight * 0.25))

      ctx.draw(false, () => {
        uni.canvasToTempFilePath({
          canvasId: 'redactionCanvas',
          fileType: 'jpg',
          quality: 0.92,
          success: (res) => {
            uni.hideLoading()
            this.redactedFilePath = res.tempFilePath
            this.exportedRedactedImage = true
            uni.showModal({
              title: '脱敏图已导出',
              content: '已生成新的脱敏图片文件，选中区域已在像素层填黑。后续分享卡和草稿只会使用这张新图。',
              showCancel: false
            })
          },
          fail: () => {
            uni.hideLoading()
            this.exportedRedactedImage = false
            this.redactedFilePath = ''
            uni.showToast({ title: '导出失败，请重试', icon: 'none' })
          }
        }, this)
      })
    },

    clearTimer() {
      if (this.scanTimer) {
        clearInterval(this.scanTimer)
        this.scanTimer = null
      }
    },

    safeVibrate() {
      try {
        if (typeof uni.vibrateShort === 'function') uni.vibrateShort()
      } catch (e) {}
    }
  }
}
</script>

<style>
view,
text,
scroll-view,
image,
video {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
}

.page {
  min-height: 100vh;
  background: #f5f5f7;
  color: #1d1d1f;
}

.redaction-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  opacity: 0;
  pointer-events: none;
}

.status-bar {
  height: 88rpx;
}

.nav {
  height: 88rpx;
  padding: 0 34rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn,
.help-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.78);
  color: #1d1d1f;
  font-weight: 900;
}

.back-btn {
  font-size: 54rpx;
  line-height: 54rpx;
  padding-bottom: 8rpx;
}

.help-btn {
  font-size: 30rpx;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 900;
  color: #1d1d1f;
}

.content,
.card-page {
  height: calc(100vh - 176rpx);
  padding: 0 32rpx;
}

.hero {
  padding: 32rpx 8rpx 24rpx;
}

.hero-title {
  display: block;
  font-size: 56rpx;
  line-height: 1.1;
  color: #1d1d1f;
  font-weight: 900;
  letter-spacing: -1rpx;
}

.hero-desc {
  display: block;
  margin-top: 18rpx;
  font-size: 25rpx;
  line-height: 1.6;
  color: #86868b;
  font-weight: 600;
}

.media-card,
.progress-card,
.review-card,
.share-card {
  background: #fff;
  border-radius: 40rpx;
  box-shadow: 0 14rpx 44rpx rgba(0, 0, 0, 0.045);
}

.media-card {
  overflow: hidden;
}

.upload-box {
  height: 560rpx;
  padding: 50rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #ffffff, #f8f8fb);
}

.upload-icon {
  width: 128rpx;
  height: 128rpx;
  border-radius: 36rpx;
  background: #007aff;
  color: #fff;
  font-size: 74rpx;
  line-height: 120rpx;
  text-align: center;
  font-weight: 300;
  box-shadow: 0 14rpx 34rpx rgba(0, 122, 255, 0.25);
}

.upload-title {
  margin-top: 32rpx;
  font-size: 32rpx;
  color: #1d1d1f;
  font-weight: 900;
}

.upload-desc {
  margin-top: 12rpx;
  font-size: 23rpx;
  color: #86868b;
  font-weight: 600;
  text-align: center;
}

.preview-box {
  position: relative;
  width: 100%;
  height: 560rpx;
  background: #111;
  overflow: hidden;
}

.preview-media {
  width: 100%;
  height: 100%;
}

.grid-overlay {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 122, 255, 0.18) 1rpx, transparent 1rpx),
    linear-gradient(90deg, rgba(0, 122, 255, 0.18) 1rpx, transparent 1rpx);
  background-size: 46rpx 46rpx;
  pointer-events: none;
}

.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 6rpx;
  background: #00e5ff;
  box-shadow: 0 0 22rpx rgba(0, 229, 255, 0.95);
  animation: scanMove 1.4s linear infinite;
}

.redaction-mark {
  position: absolute;
  background: rgba(0, 0, 0, 0.82);
  border: 2rpx solid rgba(255, 255, 255, 0.5);
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.redaction-mark text {
  color: #fff;
  font-size: 18rpx;
  font-weight: 900;
}

.redaction-mark.disabled {
  background: rgba(255, 59, 48, 0.36);
  border-color: #ff3b30;
}

.safe-badge {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: 24rpx;
  min-height: 72rpx;
  padding: 14rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.safe-icon {
  width: 38rpx;
  height: 38rpx;
  line-height: 38rpx;
  text-align: center;
  border-radius: 50%;
  background: #34c759;
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
}

.safe-text {
  flex: 1;
  font-size: 23rpx;
  color: #1d1d1f;
  font-weight: 800;
}

.progress-card,
.review-card {
  margin-top: 28rpx;
  padding: 34rpx;
}

.field-block {
  margin-top: 24rpx;
}

.field-label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 25rpx;
  color: #1d1d1f;
  font-weight: 900;
}

.note-input {
  width: 100%;
  min-height: 180rpx;
  padding: 22rpx;
  border-radius: 18rpx;
  background: #f5f5f7;
  color: #1d1d1f;
  font-size: 26rpx;
  line-height: 1.5;
  font-weight: 650;
}

.note-input.short {
  min-height: 140rpx;
}

.note-input.input-line {
  min-height: 0;
  height: 82rpx;
  line-height: 38rpx;
}

.progress-head,
.section-head,
.title-row,
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-title,
.section-title {
  font-size: 30rpx;
  color: #1d1d1f;
  font-weight: 900;
}

.progress-num {
  font-size: 26rpx;
  color: #007aff;
  font-weight: 900;
}

.progress-bar {
  margin-top: 22rpx;
  height: 14rpx;
  border-radius: 100rpx;
  background: #f2f2f7;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  border-radius: 100rpx;
  background: #007aff;
  transition: width 0.18s linear;
}

.check-list {
  margin-top: 22rpx;
}

.check-item {
  padding: 22rpx 0;
  border-bottom: 1rpx solid #f2f2f7;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.check-item:last-child {
  border-bottom: none;
}

.check-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.check-dot {
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f2f7;
  color: #86868b;
  font-size: 22rpx;
  font-weight: 900;
}

.check-dot.scanning {
  background: rgba(0, 122, 255, 0.12);
  color: #007aff;
}

.check-dot.done {
  background: #34c759;
  color: #fff;
}

.check-name {
  flex: 1;
  font-size: 25rpx;
  color: #1d1d1f;
  font-weight: 700;
}

.check-status {
  font-size: 22rpx;
  color: #86868b;
  font-weight: 800;
}

.check-status.scanning {
  color: #007aff;
}

.check-status.done {
  color: #34c759;
}

.section-subtitle {
  margin-top: 12rpx;
  display: block;
  font-size: 23rpx;
  color: #86868b;
  font-weight: 600;
}

.review-list {
  margin-top: 24rpx;
}

.review-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f2f2f7;
  display: flex;
  gap: 18rpx;
}

.review-item:last-child {
  border-bottom: none;
}

.review-check {
  margin-top: 4rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 3rpx solid #d2d2d7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
}

.review-check.checked {
  border-color: #007aff;
  background: #007aff;
}

.review-texts {
  flex: 1;
}

.review-title {
  display: block;
  font-size: 26rpx;
  color: #1d1d1f;
  font-weight: 900;
}

.review-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.45;
  color: #86868b;
  font-weight: 600;
}

.warning-box {
  margin-top: 26rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #fff7e6;
}

.warning-title {
  display: block;
  font-size: 25rpx;
  color: #8a5a00;
  font-weight: 900;
}

.warning-text {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  line-height: 1.55;
  color: #9a6a12;
  font-weight: 600;
}

.bottom-actions {
  margin-top: 30rpx;
}

.btn-row,
.card-actions {
  display: flex;
  gap: 18rpx;
}

.main-btn,
.sub-btn {
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  border-radius: 100rpx;
  font-size: 28rpx;
  font-weight: 900;
}

.main-btn {
  flex: 1;
  background: #007aff;
  color: #fff;
  box-shadow: 0 10rpx 26rpx rgba(0, 122, 255, 0.22);
}

.sub-btn {
  width: 220rpx;
  background: #fff;
  color: #1d1d1f;
}

.main-btn.disabled {
  background: #c7c7cc;
  box-shadow: none;
}

.large {
  flex: 1;
  width: auto;
}

.share-card {
  margin-top: 24rpx;
  overflow: hidden;
}

.card-image-wrap {
  position: relative;
  width: 100%;
  min-height: 240rpx;
  background: #111;
}

.card-image {
  width: 100%;
  display: block;
}

.video-placeholder {
  height: 360rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1d1d1f;
}

.video-icon {
  font-size: 78rpx;
  color: #fff;
}

.video-text {
  margin-top: 20rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 800;
}

.watermark {
  position: absolute;
  right: 18rpx;
  bottom: 18rpx;
  padding: 10rpx 16rpx;
  border-radius: 14rpx;
  background: rgba(0, 0, 0, 0.56);
  color: #fff;
  font-size: 20rpx;
  font-weight: 800;
}

.card-info {
  padding: 36rpx;
}

.card-title {
  flex: 1;
  font-size: 36rpx;
  color: #1d1d1f;
  font-weight: 900;
}

.card-tag {
  padding: 8rpx 14rpx;
  border-radius: 12rpx;
  background: rgba(52, 199, 89, 0.12);
  color: #34c759;
  font-size: 20rpx;
  font-weight: 900;
}

.info-row {
  margin-top: 18rpx;
  display: flex;
  gap: 14rpx;
  flex-wrap: wrap;
}

.info-row text {
  padding: 8rpx 14rpx;
  border-radius: 12rpx;
  background: #f5f5f7;
  color: #86868b;
  font-size: 20rpx;
  font-weight: 800;
}

.doc-section {
  margin-top: 34rpx;
}

.doc-title {
  display: block;
  font-size: 26rpx;
  color: #1d1d1f;
  font-weight: 900;
}

.doc-content {
  display: block;
  margin-top: 12rpx;
  font-size: 25rpx;
  line-height: 1.75;
  color: #515154;
  font-weight: 600;
}

.doc-content.strong {
  color: #d97706;
}

.card-footer {
  padding: 28rpx 36rpx 34rpx;
  border-top: 1rpx solid #f2f2f7;
}

.author {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.author-avatar {
  width: 42rpx;
  height: 42rpx;
  line-height: 42rpx;
  text-align: center;
  border-radius: 50%;
  background: #007aff;
  color: #fff;
  font-size: 20rpx;
  font-weight: 900;
}

.author-name,
.footer-note {
  font-size: 22rpx;
  color: #86868b;
  font-weight: 700;
}

.card-actions {
  margin-top: 30rpx;
}

.safe-bottom {
  height: 100rpx;
}

@keyframes scanMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(560rpx); }
}
</style>
