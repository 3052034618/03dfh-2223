import React, { useState } from 'react'
import { View, Text, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import PhotoUploader from '@/components/PhotoUploader'
import SignaturePad from '@/components/SignaturePad'
import { useReceiptStore } from '@/store/receipt'
import type { ReceiptConclusion } from '@/types/coldchain'
import { formatDateTime } from '@/utils/format'

const conclusionOptions: {
  key: ReceiptConclusion
  title: string
  desc: string
  color: string
}[] = [
  {
    key: 'accepted',
    title: '正常接收',
    desc: '温度记录达标，货品状态良好，全部接收',
    color: '#00B42A'
  },
  {
    key: 'partial_rejected',
    title: '部分拒收',
    desc: '部分货品存在问题，拒收有问题的部分',
    color: '#FF7D00'
  },
  {
    key: 'pending_supervisor',
    title: '待主管确认',
    desc: '存在争议，需要主管确认后再处理',
    color: '#165DFF'
  }
]

const ConclusionPage: React.FC = () => {
  const waybillInfo = useReceiptStore(state => state.waybillInfo)
  const form = useReceiptStore(state => state.form)
  const setConclusion = useReceiptStore(state => state.setConclusion)
  const setBoxCount = useReceiptStore(state => state.setBoxCount)
  const setPhotos = useReceiptStore(state => state.setPhotos)
  const setRemark = useReceiptStore(state => state.setRemark)
  const setDriverConfirmed = useReceiptStore(state => state.setDriverConfirmed)
  const prevStep = useReceiptStore(state => state.prevStep)
  const reset = useReceiptStore(state => state.reset)
  const submitReceipt = useReceiptStore(state => state.submitReceipt)
  const [submitting, setSubmitting] = useState(false)

  if (!waybillInfo) {
    Taro.showToast({
      title: '运单信息不存在',
      icon: 'none'
    })
    setTimeout(() => Taro.navigateBack(), 1500)
    return null
  }

  const handlePrev = () => {
    prevStep()
    Taro.navigateBack()
  }

  const handleSubmit = async () => {
    if (submitting) return

    if (!form.conclusion) {
      Taro.showToast({
        title: '请选择收货结论',
        icon: 'none'
      })
      return
    }

    if (!form.driverSignature) {
      Taro.showToast({
        title: '请司机确认签字',
        icon: 'none'
      })
      return
    }

    const modalRes = await Taro.showModal({
      title: '确认提交',
      content: '提交后验收记录将回传给总部，确认提交吗？'
    })

    if (!modalRes.confirm) return

    try {
      setSubmitting(true)
      Taro.showLoading({ title: '提交中...', mask: true })

      const record = await submitReceipt()

      Taro.hideLoading()
      Taro.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 1500
      })

      setTimeout(() => {
        reset()
        Taro.redirectTo({
          url: `/pages/record-detail/index?id=${record.id}`
        })
      }, 1000)
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleBoxMinus = () => {
    if (form.boxCountActual > 0) {
      setBoxCount(form.boxCountExpected, form.boxCountActual - 1)
    }
  }

  const handleBoxPlus = () => {
    setBoxCount(form.boxCountExpected, form.boxCountActual + 1)
  }

  return (
    <>
      <View className={styles.container}>
        <View className={styles.stepIndicator}>
          <View className={classnames(styles.stepItem, styles.done)}>
            <View className={classnames(styles.stepCircle, styles.done)}>✓</View>
            <Text className={styles.stepLabel}>运单信息</Text>
            <View className={styles.stepLine} />
          </View>
          <View className={classnames(styles.stepItem, styles.done)}>
            <View className={classnames(styles.stepCircle, styles.done)}>✓</View>
            <Text className={styles.stepLabel}>温度验收</Text>
            <View className={styles.stepLine} />
          </View>
          <View className={classnames(styles.stepItem, styles.active)}>
            <View className={classnames(styles.stepCircle, styles.active)}>3</View>
            <Text className={styles.stepLabel}>收货确认</Text>
          </View>
        </View>

        <View className={styles.summaryCard}>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>货品名称</Text>
            <Text className={styles.summaryValue}>{waybillInfo.productName}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>到店时间</Text>
            <Text className={styles.summaryValue}>{formatDateTime(waybillInfo.actualArrival)}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>承运车辆</Text>
            <Text className={styles.summaryValue}>{waybillInfo.vehicleNo}</Text>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>✅</Text>
            收货结论
          </Text>
          <View className={styles.conclusionOptions}>
            {conclusionOptions.map(option => (
              <View
                key={option.key}
                className={classnames(styles.conclusionOption, {
                  [styles.active]: form.conclusion === option.key
                })}
                onClick={() => setConclusion(option.key)}>
                <View className={styles.optionRadio}>
                  <View className={styles.radioInner} />
                </View>
                <View className={styles.optionContent}>
                  <Text className={styles.optionTitle}>{option.title}</Text>
                  <Text className={styles.optionDesc}>{option.desc}</Text>
                </View>
                <View
                  className={styles.optionColor}
                  style={{ background: option.color }}
                />
              </View>
            ))}
          </View>
        </View>

        <View className={styles.boxSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>📦</Text>
            箱数核验
          </Text>
          <View className={styles.boxRow}>
            <Text className={styles.boxLabel}>应收箱数</Text>
            <Text className={styles.counterValue}>{form.boxCountExpected}</Text>
          </View>
          <View className={styles.boxRow}>
            <Text className={styles.boxLabel}>实收箱数</Text>
            <View className={styles.boxCounter}>
              <View
                className={classnames(styles.counterBtn, {
                  [styles.disabled]: form.boxCountActual <= 0
                })}
                onClick={handleBoxMinus}>
                <Text>−</Text>
              </View>
              <Text className={styles.counterValue}>{form.boxCountActual}</Text>
              <View className={styles.counterBtn} onClick={handleBoxPlus}>
                <Text>+</Text>
              </View>
            </View>
          </View>
          <View className={styles.diffDisplay}>
            <Text className={styles.diffLabel}>箱数差异：</Text>
            <Text
              className={classnames(styles.diffValue, {
                [styles.zero]: form.boxDiff === 0,
                [styles.positive]: form.boxDiff > 0,
                [styles.negative]: form.boxDiff < 0
              })}>
              {form.boxDiff > 0 ? '+' : ''}{form.boxDiff} 箱
            </Text>
          </View>
        </View>

        <View className={styles.photoSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>📷</Text>
            货品拍照留痕
          </Text>
          <Text className={styles.photoHint}>
            建议拍摄货品外观、包装、温度显示等，最多6张
          </Text>
          <PhotoUploader photos={form.photos} onChange={setPhotos} maxCount={6} />
        </View>

        <View className={styles.remarkSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.titleIcon}>📝</Text>
            备注说明
          </Text>
          <Textarea
            className={styles.remarkInput}
            placeholder="填写异常说明或其他需要备注的内容..."
            value={form.remark}
            onInput={(e) => setRemark(e.detail.value)}
            maxlength={500}
          />
        </View>

        <SignaturePad
          driverName={waybillInfo.driverName}
          signature={form.driverSignature}
          onSign={setDriverConfirmed}
        />
      </View>

      <View className={styles.bottomBar}>
        <View className={classnames(styles.btn, styles.btnSecondary)} onClick={handlePrev}>
          <Text>上一步</Text>
        </View>
        <View
          className={classnames(styles.btn, styles.btnPrimary, {
            [styles.disabled]: !form.conclusion || !form.driverSignature || submitting
          })}
          onClick={handleSubmit}>
          <Text>{submitting ? '提交中...' : '提交验收'}</Text>
        </View>
      </View>
    </>
  )
}

export default ConclusionPage
