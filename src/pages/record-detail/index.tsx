import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useReceiptStore } from '@/store/receipt'
import {
  formatDateTime,
  getStatusLabel,
  getConclusionLabel,
  getSyncStatusLabel,
  getSyncStatusColor,
  formatDuration
} from '@/utils/format'
import type { ReceiptRecord } from '@/types/coldchain'

const statusIconMap: Record<string, string> = {
  normal: '✅',
  warning: '⚠️',
  abnormal: '❌'
}

const RecordDetailPage: React.FC = () => {
  const router = useRouter()
  const recordId = router.params.id
  const getRecordById = useReceiptStore(state => state.getRecordById)
  const records = useReceiptStore(state => state.records)
  const retrySync = useReceiptStore(state => state.retrySync)

  const record = getRecordById(recordId || '') as ReceiptRecord | undefined

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

  const handleRetrySync = async () => {
    try {
      await retrySync(record.id)
      Taro.showToast({ title: '已触发同步', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const renderSyncStatus = () => {
    const showRetry = record.syncStatus === 'failed' || record.syncStatus === 'pending'

    return (
      <View className={styles.syncStatusCard}>
        <View className={styles.syncStatusRow}>
          <View className={styles.syncStatusInfo}>
            <Text
              className={styles.syncStatusBadge}
              style={{
                background: `${getSyncStatusColor(record.syncStatus)}15`,
                color: getSyncStatusColor(record.syncStatus)
              }}>
              {record.syncStatus === 'syncing' ? '⏳ ' : record.syncStatus === 'failed' ? '❌ ' : record.syncStatus === 'pending' ? '🕐 ' : '✓ '}
              {getSyncStatusLabel(record.syncStatus)}
            </Text>
            <Text className={styles.syncTime}>
              提交时间：{formatDateTime(record.submittedAt)}
            </Text>
            {record.syncedAt && (
              <Text className={styles.syncTime}>
                回传时间：{formatDateTime(record.syncedAt)}
              </Text>
            )}
            {record.syncError && (
              <Text className={styles.syncError}>
                错误信息：{record.syncError}
              </Text>
            )}
          </View>
          {showRetry && (
            <View className={styles.retryBtn} onClick={handleRetrySync}>
              <Text className={styles.retryBtnText}>重试</Text>
            </View>
          )}
        </View>
      </View>
    )
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

      {renderSyncStatus()}

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
          <Text className={styles.infoLabel}>承运车辆</Text>
          <Text className={styles.infoValue}>{record.vehicleNo}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>到店时间</Text>
          <Text className={styles.infoValue}>{formatDateTime(record.actualArrival)}</Text>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>
          <Text className={styles.titleIcon}>🌡️</Text>
          温度概况
        </Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>整体状态</Text>
          <Text className={styles.infoValue}>{getStatusLabel(record.overallStatus)}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>累计异常时长</Text>
          <Text
            className={classnames(styles.infoValue, {
              [styles.textWarning]: record.totalAbnormalMinutes > 0
            })}>
            {record.totalAbnormalMinutes > 0 ? formatDuration(record.totalAbnormalMinutes) : '无异常'}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>异常次数</Text>
          <Text
            className={classnames(styles.infoValue, {
              [styles.textWarning]: record.tempNodes.reduce((sum, n) => sum + n.abnormalCount, 0) > 0
            })}>
            {record.tempNodes.reduce((sum, n) => sum + n.abnormalCount, 0)} 次
          </Text>
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
          <Text className={styles.infoLabel}>应收箱数</Text>
          <Text className={styles.infoValue}>{record.boxCountExpected} 箱</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>实收箱数</Text>
          <Text className={styles.infoValue}>{record.boxCountActual} 箱</Text>
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
          {record.photos.length > 0 && (
            <Text className={styles.photoCount}>（{record.photos.length}张）</Text>
          )}
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
          <Text className={styles.driverName}>
            司机：{record.driverName || '未填写'}
          </Text>
          {record.driverConfirmed ? (
            <View className={styles.confirmedBadge}>
              <Text>✓ 已签字确认</Text>
            </View>
          ) : (
            <View className={styles.unconfirmedBadge}>
              <Text>未确认</Text>
            </View>
          )}
        </View>
        {record.driverConfirmed && (
          <>
            <Text className={styles.confirmTime}>
              确认时间：{formatDateTime(record.driverConfirmedAt)}
            </Text>
            {record.driverSignature && (
              <Image
                className={styles.signatureImg}
                src={record.driverSignature}
                mode="aspectFit"
              />
            )}
          </>
        )}
      </View>
    </View>
  )
}

export default RecordDetailPage
