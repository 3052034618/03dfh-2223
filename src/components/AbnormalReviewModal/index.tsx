import React, { useState, useEffect } from 'react'
import { View, Text, Textarea, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { AbnormalSegment, ProductAppearance, AbnormalReview } from '@/types/coldchain'
import {
  formatTime,
  formatDuration,
  formatTemp,
  getProductAppearanceLabel,
  getProductAppearanceColor
} from '@/utils/format'

interface AbnormalReviewModalProps {
  visible: boolean
  segment: AbnormalSegment | null
  existingReview?: AbnormalReview
  onClose: () => void
  onSave: (review: Omit<AbnormalReview, 'reviewedAt' | 'reviewerName'>) => void
}

const appearanceOptions: { value: ProductAppearance; label: string; color: string }[] = [
  { value: 'normal', label: '外观正常', color: '#00B42A' },
  { value: 'slight_soft', label: '轻微发软', color: '#FF7D00' },
  { value: 'obvious_soft', label: '明显软化', color: '#F53F3F' },
  { value: 'thawed', label: '已解冻', color: '#CB2634' }
]

const AbnormalReviewModal: React.FC<AbnormalReviewModalProps> = ({
  visible,
  segment,
  existingReview,
  onClose,
  onSave
}) => {
  const [appearance, setAppearance] = useState<ProductAppearance>('normal')
  const [reviewNote, setReviewNote] = useState('')
  const [photos, setPhotos] = useState<string[]>([])

  useEffect(() => {
    if (visible && existingReview) {
      setAppearance(existingReview.appearance)
      setReviewNote(existingReview.reviewNote)
      setPhotos([...existingReview.supplementPhotos])
    } else if (visible) {
      setAppearance('normal')
      setReviewNote('')
      setPhotos([])
    }
  }, [visible, existingReview])

  const handleChooseImage = () => {
    if (photos.length >= 6) {
      Taro.showToast({ title: '最多6张照片', icon: 'none' })
      return
    }

    Taro.chooseImage({
      count: 6 - photos.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        setPhotos([...photos, ...res.tempFilePaths])
      }
    })
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    setPhotos(newPhotos)
  }

  const handlePreviewPhoto = (index: number) => {
    Taro.previewImage({
      current: photos[index],
      urls: photos
    })
  }

  const handleSave = () => {
    if (!segment) return

    onSave({
      segmentId: segment.id,
      appearance,
      supplementPhotos: [...photos],
      reviewNote
    })

    Taro.showToast({ title: '复核已保存', icon: 'success' })
    onClose()
  }

  if (!visible || !segment) return null

  return (
    <View className={styles.modalOverlay} onClick={onClose}>
      <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <View className={styles.modalHeader}>
          <Text className={styles.modalTitle}>异常片段复核</Text>
          <Text className={styles.modalClose} onClick={onClose}>✕</Text>
        </View>

        <ScrollView scrollY className={styles.modalBody}>
          <View className={styles.segmentInfo}>
            <View className={styles.segmentRow}>
              <Text className={styles.segmentLabel}>时间段</Text>
              <Text className={styles.segmentValue}>
                {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
              </Text>
            </View>
            <View className={styles.segmentRow}>
              <Text className={styles.segmentLabel}>持续时间</Text>
              <Text className={styles.segmentValue}>
                {formatDuration(segment.durationMinutes)}
              </Text>
            </View>
            <View className={styles.segmentRow}>
              <Text className={styles.segmentLabel}>温度范围</Text>
              <Text className={classnames(styles.segmentValue, styles.textWarning)}>
                {formatTemp(segment.minTemp)} ~ {formatTemp(segment.maxTemp)}
              </Text>
            </View>
            <View className={styles.segmentRow}>
              <Text className={styles.segmentLabel}>平均温度</Text>
              <Text className={classnames(styles.segmentValue, styles.textWarning)}>
                {formatTemp(segment.avgTemp)}
              </Text>
            </View>
            <View className={styles.carrierRemark}>
              <Text className={styles.remarkLabel}>承运方备注</Text>
              <Text className={styles.remarkText}>{segment.carrierRemark}</Text>
            </View>
          </View>

          <View className={styles.formSection}>
            <Text className={styles.sectionLabel}>货品外观判断 *</Text>
            <View className={styles.appearanceGrid}>
              {appearanceOptions.map(option => (
                <View
                  key={option.value}
                  className={classnames(styles.appearanceItem, {
                    [styles.active]: appearance === option.value
                  })}
                  style={{
                    borderColor: appearance === option.value ? option.color : '#E5E6EB'
                  }}
                  onClick={() => setAppearance(option.value)}>
                  <Text
                    className={styles.appearanceLabel}
                    style={{ color: appearance === option.value ? option.color : '#4E5969' }}>
                    {option.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formSection}>
            <Text className={styles.sectionLabel}>补充照片（可选，最多6张）</Text>
            <View className={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={index} className={styles.photoItem}>
                  <Image
                    className={styles.photoImg}
                    src={photo}
                    mode="aspectFill"
                    onClick={() => handlePreviewPhoto(index)}
                  />
                  <View
                    className={styles.photoDelete}
                    onClick={() => handleRemovePhoto(index)}>
                    <Text className={styles.photoDeleteText}>×</Text>
                  </View>
                </View>
              ))}
              {photos.length < 6 && (
                <View className={styles.photoAdd} onClick={handleChooseImage}>
                  <Text className={styles.photoAddIcon}>+</Text>
                  <Text className={styles.photoAddText}>添加照片</Text>
                </View>
              )}
            </View>
          </View>

          <View className={styles.formSection}>
            <Text className={styles.sectionLabel}>复核说明</Text>
            <Textarea
              className={styles.textarea}
              placeholder="请输入对该异常片段的复核说明，如货品检查情况等"
              value={reviewNote}
              maxLength={200}
              onInput={(e) => setReviewNote(e.detail.value)}
            />
            <Text className={styles.wordCount}>{reviewNote.length}/200</Text>
          </View>
        </ScrollView>

        <View className={styles.modalFooter}>
          <View className={classnames(styles.modalBtn, styles.cancelBtn)} onClick={onClose}>
            <Text>取消</Text>
          </View>
          <View className={classnames(styles.modalBtn, styles.confirmBtn)} onClick={handleSave}>
            <Text>保存复核</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default AbnormalReviewModal
