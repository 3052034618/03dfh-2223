import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { mockReceiptRecords } from '@/data/mockData'
import {
  formatDateTime,
  getStatusLabel,
  getConclusionLabel
} from '@/utils/format'

const statusIconMap: Record<string, string> = {
  normal: '✅',
  warning: '⚠️',
  abnormal: '❌'
}

const RecordDetailPage: React.FC = () => {
  const router = useRouter()
  const recordId = router.params.id

  const record = mockReceiptRecords.find(r => r.id === recordId)

  if (!record) {
    return (
      <View className={styles.container}>
        <Text style={{ textAlign: 'center', display: 'block', padding: 100, color: '#86909C' }}>
          记录不存在
        </Text>
      </View>
    )
  }

  const handlePhotoPreview = (index: number) => {
    Taro.previewImage({
      current: record.photos[index],
      urls: record.photos
    })
  }

  return (
    <View className={styles.container}>
      <View className={classnames(styles.statusCard, styles[record.overallStatus])}>
        <Text className={styles.statusIcon}>{statusIconMap[record.overallStatus]}</Text>
        <Text className={styles.statusText}>{getStatusLabel(record.overallStatus)}</Text>
        <View className={styles.conclusionTag}>
          <Text>{getConclusionLabel(record.conclusion)}</Text>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>
          <Text className={styles.titleIcon}>📋</Text>
          运单信息
        </Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>运单号</Text>
          <Text className={styles.infoValue}>{record.waybillNo}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>货品名称</Text>
          <Text className={styles.infoValue}>{record.productName}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>发货仓库</Text>
          <Text className={styles.infoValue}>{record.warehouse}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>到店时间</Text>
          <Text className={styles.infoValue}>{formatDateTime(record.actualArrival)}</Text>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>
          <Text className={styles.titleIcon}>📝</Text>
          验收信息
        </Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>收货员</Text>
          <Text className={styles.infoValue}>{record.receiverName}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>箱数差异</Text>
          <Text
            className={classnames(styles.boxDiffTag, {
              [styles.zero]: record.boxDiff === 0,
              [styles.positive]: record.boxDiff > 0,
              [styles.negative]: record.boxDiff < 0
            })}>
            {record.boxDiff > 0 ? '+' : ''}{record.boxDiff} 箱
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>验收时间</Text>
          <Text className={styles.infoValue}>{formatDateTime(record.createdAt)}</Text>
        </View>
      </View>

      <View className={styles.photosSection}>
        <Text className={styles.cardTitle}>
          <Text className={styles.titleIcon}>📷</Text>
          现场照片
        </Text>
        {record.photos.length > 0 ? (
          <View className={styles.photosGrid}>
            {record.photos.map((photo, index) => (
              <View
                key={index}
                className={styles.photoItem}
                onClick={() => handlePhotoPreview(index)}>
                <Image
                  className={styles.photoImg}
                  src={photo}
                  mode="aspectFill"
                />
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyPhotos}>暂无照片</View>
        )}
      </View>

      <View className={styles.remarkSection}>
        <Text className={styles.cardTitle}>
          <Text className={styles.titleIcon}>💬</Text>
          验收备注
        </Text>
        {record.remark ? (
          <Text className={styles.remarkContent}>{record.remark}</Text>
        ) : (
          <Text className={styles.emptyRemark}>无备注信息</Text>
        )}
      </View>

      <View className={styles.signatureSection}>
        <Text className={styles.cardTitle}>
          <Text className={styles.titleIcon}>✍️</Text>
          司机确认
        </Text>
        <View className={styles.signatureInfo}>
          <Text className={styles.driverName}>司机：{record.driverConfirmed ? '已确认' : '未确认'}</Text>
          {record.driverConfirmed && (
            <View className={styles.confirmedBadge}>
              <Text>✓ 已签字确认</Text>
            </View>
          )}
        </View>
        {record.driverConfirmed && (
          <Image
            className={styles.signatureImg}
            src="https://picsum.photos/id/1025/600/200"
            mode="aspectFit"
          />
        )}
      </View>
    </View>
  )
}

export default RecordDetailPage
