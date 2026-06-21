import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import TempStatusBadge from '@/components/TempStatusBadge'
import { useReceiptStore } from '@/store/receipt'
import {
  formatDateTime,
  getConclusionLabel,
  getConclusionColor,
  getSyncStatusLabel,
  getSyncStatusColor
} from '@/utils/format'
import type { TempStatus, ReceiptConclusion, ReceiptRecord } from '@/types/coldchain'

type FilterType = 'all' | 'pending_sync' | TempStatus | ReceiptConclusion

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending_sync', label: '待同步' },
  { key: 'normal', label: '温度达标' },
  { key: 'warning', label: '温度偏高' },
  { key: 'abnormal', label: '温度异常' },
  { key: 'accepted', label: '正常接收' },
  { key: 'partial_rejected', label: '部分拒收' },
  { key: 'pending_supervisor', label: '待主管确认' }
]

const RecordsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const records = useReceiptStore(state => state.records)
  const filterRecords = useReceiptStore(state => state.filterRecords)
  const retrySync = useReceiptStore(state => state.retrySync)
  const retryAllFailed = useReceiptStore(state => state.retryAllFailed)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const filteredRecords = useMemo(() => {
    return filterRecords(activeFilter)
  }, [records, activeFilter, filterRecords])

  const stats = useMemo(() => ({
    total: records.length,
    pending: records.filter(r => r.syncStatus !== 'synced').length,
    failed: records.filter(r => r.syncStatus === 'failed').length
  }), [records])

  const handleRecordClick = (record: ReceiptRecord) => {
    Taro.navigateTo({
      url: `/pages/record-detail/index?id=${record.id}`
    })
  }

  const handleRetrySync = async (e: any, record: ReceiptRecord) => {
    e.stopPropagation()
    if (retryingId) return

    setRetryingId(record.id)
    try {
      await retrySync(record.id)
      Taro.showToast({ title: '已触发同步', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setRetryingId(null)
    }
  }

  const handleRetryAll = async () => {
    if (stats.failed === 0) {
      Taro.showToast({ title: '没有需要重试的记录', icon: 'none' })
      return
    }
    try {
      await retryAllFailed()
      Taro.showToast({ title: '已开始批量同步', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handlePullDownRefresh = () => {
    setTimeout(() => {
      Taro.stopPullDownRefresh()
    }, 1000)
  }

  const renderSyncBadge = (record: ReceiptRecord) => {
    const showRetry = record.syncStatus === 'failed' || record.syncStatus === 'pending'

    return (
      <View className={styles.syncRow}>
        <Text
          className={styles.syncBadge}
          style={{
            background: `${getSyncStatusColor(record.syncStatus)}15`,
            color: getSyncStatusColor(record.syncStatus)
          }}>
          {record.syncStatus === 'syncing' ? '⏳ ' : record.syncStatus === 'failed' ? '❌ ' : ''}
          {getSyncStatusLabel(record.syncStatus)}
        </Text>
        {showRetry && (
          <Text
            className={classnames(styles.retryBtn, {
              [styles.retrying]: retryingId === record.id
            })}
            onClick={(e) => handleRetrySync(e, record)}>
            {retryingId === record.id ? '同步中...' : '重试'}
          </Text>
        )}
      </View>
    )
  }

  return (
    <ScrollView
      scrollY
      className={styles.container}
      onPullDownRefresh={handlePullDownRefresh}>
      <View className={styles.statsBar}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{stats.total}</Text>
          <Text className={styles.statLabel}>总记录</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statValue} style={{ color: '#FF7D00' }}>
            {stats.pending}
          </Text>
          <Text className={styles.statLabel}>待同步</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statValue} style={{ color: '#F53F3F' }}>
            {stats.failed}
          </Text>
          <Text className={styles.statLabel}>同步失败</Text>
        </View>
        {stats.failed > 0 && (
          <>
            <View className={styles.statDivider} />
            <Text className={styles.retryAllBtn} onClick={handleRetryAll}>
              全部重试
            </Text>
          </>
        )}
      </View>

      <ScrollView scrollX className={styles.filterBar}>
        {filters.map(filter => (
          <View
            key={filter.key}
            className={classnames(styles.filterItem, {
              [styles.active]: activeFilter === filter.key
            })}
            onClick={() => setActiveFilter(filter.key)}>
            <Text>{filter.label}</Text>
          </View>
        ))}
      </ScrollView>

      {filteredRecords.length > 0 ? (
        filteredRecords.map(record => (
          <View
            key={record.id}
            className={styles.recordCard}
            onClick={() => handleRecordClick(record)}>
            <View className={styles.recordTop}>
              <Text className={styles.waybillNo}>{record.waybillNo}</Text>
              <TempStatusBadge status={record.overallStatus} />
            </View>

            <Text className={styles.productName}>{record.productName}</Text>

            <View className={styles.recordMeta}>
              <Text className={styles.metaItem}>
                📍 <Text className={styles.metaValue}>{record.warehouse}</Text>
              </Text>
              <Text className={styles.metaItem}>
                📦 <Text className={styles.metaValue}>
                  箱数差异：
                  <Text
                    className={classnames(styles.boxDiff, {
                      [styles.positive]: record.boxDiff > 0,
                      [styles.negative]: record.boxDiff < 0
                    })}>
                    {record.boxDiff > 0 ? '+' : ''}{record.boxDiff}
                  </Text>
                </Text>
              </Text>
            </View>

            <View className={styles.recordBottom}>
              <View className={styles.receiverInfo}>
                <Text className={styles.receiverName}>收货员：{record.receiverName}</Text>
              </View>
              <Text
                className={styles.conclusionTag}
                style={{
                  background: `${getConclusionColor(record.conclusion)}15`,
                  color: getConclusionColor(record.conclusion)
                }}>
                {getConclusionLabel(record.conclusion)}
              </Text>
            </View>

            {renderSyncBadge(record)}

            <View className={styles.timeRow}>
              <Text className={styles.timeText}>
                {formatDateTime(record.createdAt)}
              </Text>
              {record.photos.length > 0 && (
                <Text className={styles.photoCount}>📷 {record.photos.length}张</Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>暂无相关验收记录</Text>
        </View>
      )}
    </ScrollView>
  )
}

export default RecordsPage
