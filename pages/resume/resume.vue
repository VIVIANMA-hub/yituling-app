<template>
    <view class="apple-container">
        <view class="status-bar"></view>
        <view class="nav-header">
            <text class="back-icon" @click="goBack">←</text>
            <text class="nav-title">结构化求医简历</text>
            <view class="placeholder"></view>
        </view>

        <view class="intro-text">
            帮助患者将杂乱的病史和影像资料，一键生成标准时间轴报告，提升向上级医院转诊沟通效率。
        </view>

        <view class="form-card shadow-apple">
            <view class="f-group">
                <text class="f-label">主诉与现病史</text>
                <textarea class="f-textarea" placeholder="例如：发现右肺下叶结节3个月，伴偶发干咳..." auto-height />
            </view>
            
            <view class="f-group">
                <text class="f-label">既往重要病史</text>
                <input class="f-input" placeholder="输入高血压、糖尿病、手术史等" />
            </view>

            <view class="f-group border-none">
                <text class="f-label">历次影像检查时间轴</text>
                <view class="timeline-box">
                    <view class="t-item">
                        <text class="t-date">2026.01.12</text>
                        <text class="t-info">县医院 首次胸部平扫CT</text>
                    </view>
                    <view class="t-item">
                        <text class="t-date">2026.04.05</text>
                        <text class="t-info">市医院 增强CT复查</text>
                    </view>
                </view>
                <view class="add-btn">＋ 添加历史影像记录</view>
            </view>
        </view>

        <view class="submit-btn shadow-blue" @click="generatePDF">
            生成标准化 PDF 简历
        </view>
    </view>
</template>

<script>
export default {
    methods: {
        goBack() { uni.navigateBack(); },
        generatePDF() {
            uni.showLoading({ title: 'AI 提取与排版中...' });
            setTimeout(() => {
                uni.hideLoading();
                uni.showToast({ title: '已生成可转发文档', icon: 'success' });
            }, 1500);
        }
    }
}
</script>

<style>
.apple-container { min-height: 100vh; background: #FBFBFD; font-family: -apple-system, sans-serif; }
.status-bar { height: 100rpx; }
.nav-header { height: 88rpx; display: flex; justify-content: space-between; align-items: center; padding: 0 40rpx; margin-bottom: 20rpx;}
.back-icon { font-size: 44rpx; font-weight: 500; width: 60rpx;} .nav-title { font-size: 34rpx; font-weight: 800; } .placeholder{width:60rpx;}
.intro-text { padding: 0 40rpx 40rpx; font-size: 26rpx; color: #86868B; line-height: 1.6; }

.form-card { background: #FFFFFF; border-radius: 40rpx; padding: 10rpx 40rpx; margin: 0 40rpx 60rpx; box-shadow: 0 10rpx 40rpx rgba(0,0,0,0.03); }
.f-group { padding: 30rpx 0; border-bottom: 1px solid #F2F2F7; display: flex; flex-direction: column; gap: 16rpx;}
.border-none { border-bottom: none; }
.f-label { font-size: 30rpx; font-weight: 800; color: #1D1D1F; }
.f-input, .f-textarea { font-size: 28rpx; color: #1D1D1F; background: #F5F5F7; padding: 24rpx; border-radius: 16rpx; width: auto;}

.timeline-box { display: flex; flex-direction: column; gap: 20rpx; margin: 10rpx 0; border-left: 4rpx solid #E5E5EA; margin-left: 10rpx; padding-left: 20rpx;}
.t-item { display: flex; flex-direction: column; gap: 4rpx; position: relative;}
.t-item::before { content: ''; position: absolute; left: -28rpx; top: 12rpx; width: 12rpx; height: 12rpx; background: #007AFF; border-radius: 50%; }
.t-date { font-size: 22rpx; color: #86868B; font-weight: 800; }
.t-info { font-size: 26rpx; color: #1D1D1F; font-weight: 600; }

.add-btn { color: #007AFF; font-size: 26rpx; font-weight: 800; margin-top: 10rpx; }

.submit-btn { background: #1D1D1F; color: #fff; height: 110rpx; border-radius: 100rpx; margin: 0 40rpx; display: flex; justify-content: center; align-items: center; font-size: 32rpx; font-weight: 800; box-shadow: 0 20rpx 40rpx rgba(0,0,0,0.15); transition: transform 0.2s;}
.submit-btn:active { transform: scale(0.98); }
</style>