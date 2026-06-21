import React, { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import TempStatusBadge from '@/components/TempStatusBadge'
import { mockReceiptRecords } from '@/data/mockData'
import { formatDateTime, getConclusionLabel, getConclusionColor } from '@/utils/format'
import type { TempStatus, ReceiptConclusion, ReceiptRecord } from '@/types/coldchain'

type FilterType = 'all' | TempStatus | ReceiptConclusion

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'normal', label: '温度达标' },
  { key: 'warning', label: '温度偏高' },
  { key: 'abnormal', label: '温度异常' },
  { key: 'accepted', label: '正常接收' },
  { key: 'partial_rejected', label: '部分拒收' },
  { key: 'pending_supervisor', label: '待主管确认' }
]

const RecordsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const filteredRecords = mockReceiptRecords.filter(record => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'normal' || activeFilter === 'warning' || activeFilter === 'abnormal') {
      return record.overallStatus === activeFilter
    }
    return record.conclusion === activeFilter
  })

  const handleRecordClick = (record: ReceiptRecord) => {
    Taro.navigateTo({
      url: `/pages/record-detail/index?id=${record.id}`
    })
  }

  const handlePullDownRefresh = () => {
    setTimeout(() => {
      Taro.stopPullDownRefresh()
    }, 1000)
  }

  return (
    <ScrollView
      scrollY
      className={styles.container}
      onPullDownRefresh={handlePullDownRefresh}>
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

            <View style={{ marginTop: '24rpx', textAlign: 'right' }}>
              <Text className={styles.timeText}>
                {formatDateTime(record.createdAt)}
              </Text>
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
