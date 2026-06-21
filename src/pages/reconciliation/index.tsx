import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useReceiptStore } from '@/store/receipt'
import { formatDateTime, formatDate, getHqDispositionLabel, getHqDispositionColor, getSyncStatusBizLabel, getSyncStatusColor } from '@/utils/format'
import type { ReceiptRecord } from '@/types/coldchain'

type GroupBy = 'carrier' | 'date'

interface BatchGroup {
  key: string
  label: string
  records: ReceiptRecord[]
  total: number
  synced: number
  pending: number
  partialRejected: number
  returned: number
  abnormalAmount: number
}

const ReconciliationPage: React.FC = () => {
  const records = useReceiptStore(state => state.records)
  const retrySync = useReceiptStore(state => state.retrySync)
  const [groupBy, setGroupBy] = useState<GroupBy>('carrier')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [showPending, setShowPending] = useState(false)

  const filterByDateRange = (list: ReceiptRecord[]) => {
    if (!dateFrom && !dateTo) return list
    return list.filter(r => {
      const ad = r.actualArrival.substring(0, 10)
      const sd = r.submittedAt.substring(0, 10)
      const arrivalInRange = (!dateFrom || ad >= dateFrom) && (!dateTo || ad <= dateTo)
      const submittedInRange = (!dateFrom || sd >= dateFrom) && (!dateTo || sd <= dateTo)
      return arrivalInRange || submittedInRange
    })
  }

  const syncedRecords = useMemo(() => {
    return filterByDateRange(records.filter(r => r.syncStatus === 'synced'))
  }, [records, dateFrom, dateTo])

  const pendingRecords = useMemo(() => {
    return filterByDateRange(records.filter(r => r.syncStatus !== 'synced' && r.syncStatus !== 'failed'))
  }, [records, dateFrom, dateTo])

  const failedRecords = useMemo(() => {
    return filterByDateRange(records.filter(r => r.syncStatus === 'failed'))
  }, [records, dateFrom, dateTo])

  const batchGroups = useMemo(() => {
    const map = new Map<string, BatchGroup>()
    syncedRecords.forEach(r => {
      let key: string, label: string
      if (groupBy === 'carrier') {
        key = r.driverName
        label = `${r.driverName}（${r.vehicleNo}）`
      } else {
        key = r.syncedAt ? r.syncedAt.substring(0, 10) : r.submittedAt.substring(0, 10)
        label = key
      }
      const group = map.get(key) || {
        key,
        label,
        records: [],
        total: 0,
        synced: 0,
        pending: 0,
        partialRejected: 0,
        returned: 0,
        abnormalAmount: 0
      }
      group.records.push(r)
      group.total++
      if (r.syncStatus === 'synced') group.synced++
      if (r.hqCallback?.finalDisposition === 'partial_rejected') {
        group.partialRejected++
        group.abnormalAmount += Math.abs(r.boxDiff) * r.productCount
      }
      if (r.hqCallback?.finalDisposition === 'returned') group.returned++
      map.set(key, group)
    })
    return Array.from(map.values()).sort((a, b) => b.records.length - a.records.length)
  }, [syncedRecords, groupBy])

  const handleQuickDate = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    setDateFrom(formatDate(from.toISOString()))
    setDateTo(formatDate(to.toISOString()))
  }

  const handleExpand = (key: string) => {
    setExpandedKey(expandedKey === key ? null : key)
  }

  const handleRecordDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/record-detail/index?id=${id}` })
  }

  const handleRetryPending = async (id: string) => {
    if (retryingId) return
    setRetryingId(id)
    try {
      await retrySync(id)
      Taro.showToast({ title: '已触发同步', icon: 'success' })
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setRetryingId(null)
    }
  }

  const getDispositionTag = (r: ReceiptRecord) => {
    if (!r.hqCallback?.finalDisposition) return null
    const d = r.hqCallback.finalDisposition
    return (
      <Text
        className={styles.dispositionTag}
        style={{ background: `${getHqDispositionColor(d)}15`, color: getHqDispositionColor(d) }}>
        {getHqDispositionLabel(d)}
      </Text>
    )
  }

  const renderPendingSection = (title: string, icon: string, list: ReceiptRecord[]) => {
    if (list.length === 0) return null
    return (
      <View className={styles.pendingSection}>
        <Text className={styles.pendingTitle}>
          <Text>{icon} </Text>{title}（{list.length}单）
        </Text>
        {list.map(r => (
          <View key={r.id} className={styles.pendingItem} onClick={() => handleRecordDetail(r.id)}>
            <View className={styles.pendingItemTop}>
              <Text className={styles.pendingWaybill}>{r.waybillNo}</Text>
              <Text
                className={styles.pendingStatus}
                style={{ background: `${getSyncStatusColor(r.syncStatus)}15`, color: getSyncStatusColor(r.syncStatus) }}>
                {getSyncStatusBizLabel(r.syncStatus, !!r.hqCallback)}
              </Text>
            </View>
            <Text className={styles.pendingProduct}>{r.productName}</Text>
            <View className={styles.pendingMeta}>
              <Text className={styles.pendingMetaText}>司机：{r.driverName}</Text>
              <Text className={styles.pendingMetaText}>{formatDateTime(r.submittedAt)}</Text>
            </View>
            {r.syncStatus === 'pending' && (
              <View className={styles.pendingAction}>
                <Text
                  className={classnames(styles.pendingRetryBtn, { [styles.retrying]: retryingId === r.id })}
                  onClick={(e) => { e.stopPropagation(); handleRetryPending(r.id) }}>
                  {retryingId === r.id ? '同步中...' : '模拟回传'}
                </Text>
                <Text
                  className={styles.pendingTimelineBtn}
                  onClick={(e) => { e.stopPropagation(); handleRecordDetail(r.id) }}>
                  查看进度 →
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    )
  }

  return (
    <ScrollView scrollY className={styles.container}>
      <View className={styles.filterCard}>
        <View className={styles.filterRow}>
          <View className={styles.filterGroup}>
            <Text className={styles.filterLabel}>分组方式</Text>
            <View className={styles.groupBtns}>
              <Text
                className={classnames(styles.groupBtn, { [styles.active]: groupBy === 'carrier' })}
                onClick={() => setGroupBy('carrier')}>
                按承运方
              </Text>
              <Text
                className={classnames(styles.groupBtn, { [styles.active]: groupBy === 'date' })}
                onClick={() => setGroupBy('date')}>
                按日期
              </Text>
            </View>
          </View>
        </View>
        <View className={styles.dateRangeRow}>
          <Picker mode="date" onChange={(e) => setDateFrom(e.detail.value)} value={dateFrom || ''}>
            <View className={classnames(styles.dateInput, { [styles.dateSelected]: !!dateFrom })}>
              <Text>{dateFrom || '开始日期'}</Text>
            </View>
          </Picker>
          <Text className={styles.dateSep}>至</Text>
          <Picker mode="date" onChange={(e) => setDateTo(e.detail.value)} value={dateTo || ''}>
            <View className={classnames(styles.dateInput, { [styles.dateSelected]: !!dateTo })}>
              <Text>{dateTo || '结束日期'}</Text>
            </View>
          </Picker>
        </View>
        <View className={styles.quickDateRow}>
          <Text className={styles.quickDateBtn} onClick={() => handleQuickDate(7)}>近7天</Text>
          <Text className={styles.quickDateBtn} onClick={() => handleQuickDate(30)}>近30天</Text>
          <Text className={styles.quickDateBtn} onClick={() => handleQuickDate(90)}>近90天</Text>
          {(dateFrom || dateTo) && (
            <Text className={styles.quickDateClear} onClick={() => { setDateFrom(''); setDateTo('') }}>清除</Text>
          )}
        </View>
      </View>

      {(pendingRecords.length > 0 || failedRecords.length > 0) && (
        <View className={styles.pendingToggle} onClick={() => setShowPending(!showPending)}>
          <Text className={styles.pendingToggleIcon}>{showPending ? '▼' : '▶'}</Text>
          <Text className={styles.pendingToggleText}>
            待确认/待回传清单
          </Text>
          <Text className={styles.pendingToggleBadge}>
            {pendingRecords.length + failedRecords.length}
          </Text>
        </View>
      )}

      {showPending && (
        <View className={styles.pendingCard}>
          {renderPendingSection('待回传', '📤', pendingRecords)}
          {renderPendingSection('回传失败', '❌', failedRecords)}
        </View>
      )}

      <View className={styles.summaryCard}>
        <Text className={styles.cardTitle}>
          <Text className={styles.titleIcon}>📋</Text>
          已回传对账汇总
        </Text>
        <View className={styles.summaryGrid}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{syncedRecords.length}</Text>
            <Text className={styles.summaryLabel}>已回传</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue} style={{ color: '#FF7D00' }}>
              {syncedRecords.filter(r => r.hqCallback?.finalDisposition === 'partial_rejected').length}
            </Text>
            <Text className={styles.summaryLabel}>部分拒收</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue} style={{ color: '#F53F3F' }}>
              {syncedRecords.filter(r => r.hqCallback?.finalDisposition === 'returned').length}
            </Text>
            <Text className={styles.summaryLabel}>整单退回</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue} style={{ color: '#00B42A' }}>
              {syncedRecords.filter(r => r.hqCallback?.finalDisposition === 'accepted').length}
            </Text>
            <Text className={styles.summaryLabel}>同意接收</Text>
          </View>
        </View>
      </View>

      {batchGroups.length > 0 ? (
        batchGroups.map(group => (
          <View key={group.key} className={styles.batchCard}>
            <View className={styles.batchHeader} onClick={() => handleExpand(group.key)}>
              <View className={styles.batchInfo}>
                <Text className={styles.batchLabel}>{group.label}</Text>
                <Text className={styles.batchCount}>{group.total} 单</Text>
              </View>
              <View className={styles.batchTags}>
                {group.partialRejected > 0 && (
                  <Text className={styles.batchTag} style={{ background: 'rgba(255,125,0,0.1)', color: '#FF7D00' }}>
                    拒收{group.partialRejected}
                  </Text>
                )}
                {group.returned > 0 && (
                  <Text className={styles.batchTag} style={{ background: 'rgba(245,63,63,0.1)', color: '#F53F3F' }}>
                    退回{group.returned}
                  </Text>
                )}
                <Text className={styles.expandIcon}>{expandedKey === group.key ? '▼' : '▶'}</Text>
              </View>
            </View>

            {expandedKey === group.key && (
              <View className={styles.batchDetail}>
                {group.records.map(r => (
                  <View key={r.id} className={styles.batchRecord} onClick={() => handleRecordDetail(r.id)}>
                    <View className={styles.batchRecordTop}>
                      <Text className={styles.batchRecordNo}>{r.waybillNo}</Text>
                      {getDispositionTag(r)}
                    </View>
                    <Text className={styles.batchRecordProduct}>{r.productName}</Text>
                    <View className={styles.batchRecordMeta}>
                      {r.hqCallback && (
                        <Text className={styles.batchRecordMetaText}>
                          确认号：{r.hqCallback.confirmNo}
                        </Text>
                      )}
                      <Text className={styles.batchRecordMetaText}>
                        回传：{formatDateTime(r.syncedAt || r.submittedAt)}
                      </Text>
                    </View>
                    {r.hqCallback?.finalDispositionNote && (
                      <Text className={styles.batchRecordNote}>
                        {r.hqCallback.finalDispositionNote}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>暂无已回传记录</Text>
        </View>
      )}
    </ScrollView>
  )
}

export default ReconciliationPage
